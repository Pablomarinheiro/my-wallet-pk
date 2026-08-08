import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, FileSpreadsheet, FileType2, Loader2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Line, LineChart, Legend,
} from "recharts";
import { currency, shortDate } from "@/lib/mock-data";
import { useAccounts, useCategories, useTransactions } from "@/hooks/use-mywallet";
import { exportCSV, exportExcel, exportPDF, type ExportRow } from "@/lib/exports";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvImport } from "@/components/csv-import";


export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — My Wallet" }] }),
  component: RelatoriosPage,
});

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function RelatoriosPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const today = new Date();
  const [preset, setPreset] = useState<string>("30");
  const [from, setFrom] = useState<string>(isoDate(new Date(today.getTime() - 29 * 86400000)));
  const [to, setTo] = useState<string>(isoDate(today));
  const [accountId, setAccountId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  function applyPreset(v: string) {
    setPreset(v);
    if (v === "custom") return;
    const days = parseInt(v, 10);
    const end = new Date();
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    setFrom(isoDate(start));
    setTo(isoDate(end));
  }

  const filtered = useMemo(() => {
    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T23:59:59");
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (d < start || d > end) return false;
      if (accountId !== "all" && t.account_id !== accountId) return false;
      if (categoryId !== "all" && t.category_id !== categoryId) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, from, to, accountId, categoryId, typeFilter]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += Number(t.amount);
      else if (t.type === "expense") expense += Number(t.amount);
    }
    return { income, expense, balance: income - expense, count: filtered.length };
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map<string, { key: string; month: string; income: number; expense: number }>();
    for (const t of filtered) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const cur = map.get(key) ?? { key, month: label, income: 0, expense: 0 };
      if (t.type === "income") cur.income += Number(t.amount);
      else if (t.type === "expense") cur.expense += Number(t.amount);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  const period = `${new Date(from).toLocaleDateString("pt-BR")} — ${new Date(to).toLocaleDateString("pt-BR")}`;

  function toExportRows(): ExportRow[] {
    return filtered
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        date: t.date,
        description: t.description,
        category: t.category?.name ?? "—",
        account: t.account?.name ?? "—",
        type: t.type,
        status: t.status,
        amount: Number(t.amount),
      }));
  }

  const summary = {
    "Receitas": totals.income,
    "Despesas": totals.expense,
    "Saldo": totals.balance,
  };

  function doExport(kind: "pdf" | "excel" | "csv") {
    if (filtered.length === 0) { toast.error("Nenhum dado no período selecionado"); return; }
    const rows = toExportRows();
    const filename = `my-wallet_${from}_a_${to}`;
    try {
      if (kind === "csv") exportCSV(rows, filename);
      else if (kind === "excel") exportExcel(rows, filename, summary);
      else exportPDF(rows, filename, { title: "Relatório financeiro", period, summary });
      toast.success("Relatório gerado");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao exportar");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Analise seu histórico financeiro, exporte para PDF, Excel ou CSV e importe dados."
      />

      <Tabs defaultValue="relatorios" className="space-y-6">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="relatorios" className="rounded-xl">Relatórios</TabsTrigger>
          <TabsTrigger value="importar" className="rounded-xl">Importar CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="importar" className="space-y-6">
          <CsvImport />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="grid grid-cols-1 gap-3 p-5 md:grid-cols-6">

          <div className="space-y-1.5"><Label>Período</Label>
            <Select value={preset} onValueChange={applyPreset}>
              <SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Últimos 12 meses</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>De</Label><Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} className="h-10 rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Até</Label><Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} className="h-10 rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Transações</div><div className="mt-1 text-2xl font-bold">{totals.count}</div></CardContent></Card>
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Receitas</div><div className="mt-1 text-2xl font-bold text-success">{currency(totals.income)}</div></CardContent></Card>
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Despesas</div><div className="mt-1 text-2xl font-bold text-destructive">{currency(totals.expense)}</div></CardContent></Card>
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5"><div className="text-xs text-muted-foreground">Saldo</div><div className={`mt-1 text-2xl font-bold ${totals.balance >= 0 ? "text-primary" : "text-destructive"}`}>{currency(totals.balance)}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Evolução mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {monthly.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Receitas" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Comparativo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {monthly.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem dados no período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                    <Bar dataKey="income" name="Receitas" fill="#2563EB" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardHeader><CardTitle className="text-base">Exportar</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: FileType2, label: "PDF", desc: "Relatório visual pronto para imprimir", kind: "pdf" as const },
            { icon: FileSpreadsheet, label: "Excel", desc: "Planilha .xlsx com todos os dados", kind: "excel" as const },
            { icon: FileText, label: "CSV", desc: "Dados brutos separados por ponto e vírgula", kind: "csv" as const },
          ].map((e) => (
            <button key={e.label} onClick={() => doExport(e.kind)} disabled={isLoading || filtered.length === 0}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"><e.icon className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="text-sm font-semibold">{e.label}</div><div className="text-[11px] text-muted-foreground">{e.desc}</div></div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardHeader><CardTitle className="text-base">Prévia — {filtered.length} transação(ões) · {period}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid place-items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação no período selecionado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 20).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-muted-foreground">{shortDate(t.date)}</TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell><Badge variant="secondary" className="rounded-full">{t.category?.name ?? "—"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{t.account?.name ?? "—"}</TableCell>
                      <TableCell>
                        {t.type === "income"
                          ? <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Receita</Badge>
                          : t.type === "expense"
                          ? <Badge className="rounded-full bg-destructive/12 text-destructive hover:bg-destructive/12">Despesa</Badge>
                          : <Badge className="rounded-full">Transferência</Badge>}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${t.type === "income" ? "text-success" : ""}`}>
                        {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""} {currency(Number(t.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 20 && (
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  Mostrando 20 de {filtered.length} — exporte para ver todas.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>

  );
}
