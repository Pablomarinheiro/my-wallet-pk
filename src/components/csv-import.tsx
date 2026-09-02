import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts, useCategories } from "@/hooks/use-mywallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UploadCloud, FileSpreadsheet, Loader2, Download, X } from "lucide-react";
import { toast } from "sonner";
import { currency } from "@/lib/format";
import {
  guessColumn, inferColumns, normalizeName, parseAmount, parseCsv, parseDate, parseType,
} from "@/lib/csv-import";


type Mapping = { date: string; description: string; amount: string; type: string; category: string; account: string };

const NONE = "none";

const TEMPLATE = `Data;Descrição;Valor;Tipo;Categoria;Conta
01/08/2026;Salário de agosto;5000,00;Receita;Salário;Conta corrente
02/08/2026;Mercado do mês;-450,90;Despesa;Mercado;Conta corrente
`;

export function CsvImport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Mapping>({ date: NONE, description: NONE, amount: NONE, type: NONE, category: NONE, account: NONE });
  const [defaultAccount, setDefaultAccount] = useState<string>(NONE);
  const [createCategories, setCreateCategories] = useState(true);
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);

  function loadText(name: string, text: string) {
    const { headers: h, rows: r } = parseCsv(text);
    if (h.length === 0 || r.length === 0) { toast.error("Arquivo CSV vazio ou inválido"); return; }
    setFileName(name);
    setHeaders(h);
    setRows(r);
    const guessed = {
      date: guessColumn(h, ["data", "date", "data da compra", "data lançamento", "dt", "vencimento", "competencia"]),
      description: guessColumn(h, ["descrição", "description", "histórico", "historico", "lançamento", "lancamento", "titulo", "título", "detalhe", "memo", "estabelecimento"]),
      amount: guessColumn(h, ["valor", "amount", "value", "montante", "total", "r$", "credito", "debito"]),
      type: guessColumn(h, ["tipo", "type", "natureza", "operacao", "operação", "entrada/saida"]),
      category: guessColumn(h, ["categoria", "category", "classificacao", "classificação", "grupo"]),
      account: guessColumn(h, ["conta", "account", "banco", "carteira", "cartao", "cartão"]),
    };
    const inferred = inferColumns(r, h.length);
    setMap({
      ...guessed,
      date: guessed.date !== NONE ? guessed.date : inferred.date,
      amount: guessed.amount !== NONE ? guessed.amount : inferred.amount,
      description: guessed.description !== NONE ? guessed.description : inferred.description,
    });
    toast.success(`${r.length} linha(s) carregada(s)`);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      let text = new TextDecoder("utf-8").decode(buf);
      // Fallback for files exported as latin-1 (accents come back as "\uFFFD")
      if (text.includes("\uFFFD")) text = new TextDecoder("windows-1252").decode(buf);
      loadText(file.name, text);
    };
    reader.readAsArrayBuffer(file);
  }


  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) readFile(f);
    e.target.value = "";
  }

  const accountByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(normalizeName(a.name), a.id);
    return m;
  }, [accounts]);

  const categoryByName = useMemo(() => {
    const m = new Map<string, { id: string; type: string }>();
    for (const c of categories) m.set(normalizeName(c.name), { id: c.id, type: c.type });
    return m;
  }, [categories]);

  const parsed = useMemo(() => {
    if (rows.length === 0) return [];
    const idx = (k: keyof Mapping) => (map[k] === NONE ? -1 : Number(map[k]));
    const fallbackAccountId =
      defaultAccount !== NONE ? defaultAccount : smartFill && accounts.length === 1 ? accounts[0]!.id : null;
    let lastDate: string | null = null;

    return rows.map((r, i) => {
      const cell = (k: keyof Mapping) => (idx(k) >= 0 ? (r[idx(k)] ?? "") : "");
      const suggestions: string[] = [];
      const errors: string[] = [];

      const rawAmount = cell("amount");
      const amount = parseAmount(rawAmount);

      let date = parseDate(cell("date"));
      if (date) lastDate = date;
      else if (smartFill) {
        date = lastDate ?? new Date().toISOString().slice(0, 10);
        suggestions.push("data estimada");
      }

      const description = cell("description") || "Importado";
      const rawType = cell("type");
      const hint = smartFill ? suggestCategory(description) : null;
      let type = parseType(rawType, amount ?? 0);
      if (!rawType && hint && (amount ?? 0) >= 0) {
        // Sign alone is ambiguous when the file has no type column
        if (hint.type !== type) suggestions.push("tipo sugerido");
        type = hint.type;
      }

      let catName = cell("category");
      if (!catName && hint) { catName = hint.name; suggestions.push("categoria sugerida"); }

      const accName = cell("account");
      let accountId = accName ? accountByName.get(normalizeName(accName)) ?? null : null;
      if (!accountId && fallbackAccountId) {
        accountId = fallbackAccountId;
        if (accName || defaultAccount === NONE) suggestions.push("conta sugerida");
      }

      if (amount === null || amount === 0) errors.push("valor inválido ou zerado");
      if (!date) errors.push("data inválida");
      if (!accountId) suggestions.push("sem conta");

      return {
        line: i + 2,
        date, description, amount: amount === null ? null : Math.abs(amount),
        type, catName, accName, accountId, errors, suggestions,
      };
    });
  }, [rows, map, accountByName, accounts, defaultAccount, smartFill]);

  const valid = parsed.filter((p) => p.errors.length === 0);
  const invalid = parsed.length - valid.length;
  const suggestedCount = valid.filter((p) => p.suggestions.some((s) => s !== "sem conta")).length;


  async function runImport() {
    if (!user) { toast.error("Não autenticado"); return; }
    if (valid.length === 0) { toast.error("Nenhuma linha válida para importar"); return; }
    setImporting(true);
    try {
      const catMap = new Map(categoryByName);

      if (createCategories) {
        const missing = new Map<string, "income" | "expense">();
        for (const p of valid) {
          if (!p.catName) continue;
          const key = normalizeName(p.catName);
          if (!catMap.has(key) && !missing.has(key)) missing.set(key, p.type);
        }
        if (missing.size > 0) {
          const toCreate = Array.from(missing.entries()).map(([key, type]) => ({
            user_id: user.id,
            name: valid.find((p) => normalizeName(p.catName) === key)?.catName ?? key,
            type,
          }));
          const { data, error } = await supabase.from("categories").insert(toCreate).select("id, name, type");
          if (error) throw error;
          for (const c of data ?? []) catMap.set(normalizeName(c.name), { id: c.id, type: c.type });
        }
      }

      const fallbackAccount = defaultAccount === NONE ? null : defaultAccount;
      const payload = valid.map((p) => ({
        user_id: user.id,
        description: p.description,
        amount: p.amount as number,
        type: p.type,
        status: "confirmed",
        date: p.date as string,
        category_id: p.catName ? catMap.get(normalizeName(p.catName))?.id ?? null : null,
        account_id: p.accountId ?? fallbackAccount,
      }));

      for (let i = 0; i < payload.length; i += 200) {
        const { error } = await supabase.from("transactions").insert(payload.slice(i, i + 200));
        if (error) throw error;
      }

      await qc.invalidateQueries({ queryKey: ["transactions"] });
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`${payload.length} transação(ões) importada(s)`);
      reset();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao importar");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFileName(null); setHeaders([]); setRows([]);
    setMap({ date: NONE, description: NONE, amount: NONE, type: NONE, category: NONE, account: NONE });
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "modelo-importacao-my-wallet.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const fields: { key: keyof Mapping; label: string }[] = [
    { key: "date", label: "Data" },
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor" },
    { key: "type", label: "Tipo" },
    { key: "category", label: "Categoria" },
    { key: "account", label: "Conta" },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Importar CSV</CardTitle>
          <Button variant="outline" size="sm" className="rounded-2xl" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Baixar modelo
          </Button>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={`grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">Arraste um arquivo .csv ou clique para selecionar</div>
            <div className="text-xs text-muted-foreground">Separadores aceitos: ponto e vírgula, vírgula ou tabulação</div>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onPick} />
          </div>

          {fileName && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="min-w-0 flex-1 truncate font-medium">{fileName}</span>
              <Badge variant="secondary" className="rounded-full">{rows.length} linhas</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader><CardTitle className="text-base">Mapear colunas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Select value={map[f.key]} onValueChange={(v) => setMap((m) => ({ ...m, [f.key]: v }))}>
                    <SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Ignorar —</SelectItem>
                      {headers.map((h, i) => <SelectItem key={`${h}-${i}`} value={String(i)}>{h || `Coluna ${i + 1}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Conta padrão</Label>
                <Select value={defaultAccount} onValueChange={setDefaultAccount}>
                  <SelectTrigger className="h-10 rounded-2xl"><SelectValue placeholder="Sem conta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem conta</SelectItem>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3 md:col-span-2">
                <div>
                  <div className="text-sm font-medium">Criar categorias ausentes</div>
                  <div className="text-xs text-muted-foreground">Categorias do arquivo que ainda não existem serão criadas</div>
                </div>
                <Switch checked={createCategories} onCheckedChange={setCreateCategories} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-base">
                Prévia — {valid.length} válida(s){invalid > 0 ? ` · ${invalid} com erro` : ""}
              </CardTitle>
              <Button className="rounded-2xl" onClick={runImport} disabled={importing || valid.length === 0}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                Importar {valid.length} transação(ões)
              </Button>
            </CardHeader>
            <CardContent>
              {valid.length === 0 && (
                <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
                  Nenhuma linha válida. Confira em "Mapear colunas" se <b>Data</b> e <b>Valor</b> apontam para as colunas certas
                  do seu arquivo — a coluna de data precisa ter datas (ex.: 05/08/2026) e a de valor, números (ex.: -450,90).
                </div>
              )}
              <div className="overflow-x-auto">

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.slice(0, 20).map((p) => (
                      <TableRow key={p.line} className={p.errors.length ? "bg-destructive/5" : undefined}>
                        <TableCell className="text-muted-foreground">{p.line}</TableCell>
                        <TableCell>{p.date ?? <span className="text-destructive">inválida</span>}</TableCell>
                        <TableCell className="font-medium">{p.description}</TableCell>
                        <TableCell className="text-muted-foreground">{p.catName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.accName || (defaultAccount !== NONE ? accounts.find((a) => a.id === defaultAccount)?.name : "—")}
                        </TableCell>
                        <TableCell>
                          {p.type === "income"
                            ? <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Receita</Badge>
                            : <Badge className="rounded-full bg-destructive/12 text-destructive hover:bg-destructive/12">Despesa</Badge>}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {p.amount === null ? <span className="text-destructive">inválido</span> : currency(p.amount)}
                        </TableCell>
                        <TableCell className="text-xs text-destructive">{p.errors.join(", ")}</TableCell>
                      </TableRow>
                    ))}

                  </TableBody>
                </Table>
                {parsed.length > 20 && (
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    Mostrando 20 de {parsed.length} linhas.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
