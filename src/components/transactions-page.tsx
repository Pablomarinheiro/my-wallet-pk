import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2, Wallet, Loader2 } from "lucide-react";
import { currency, shortDate, type TxType } from "@/lib/mock-data";
import { getIcon } from "@/lib/icons";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useAccounts, useCategories, useDeleteTransaction, useTransactions, useUpsertTransaction,
  type TransactionWithRelations,
} from "@/hooks/use-mywallet";
import { toast } from "sonner";

function TxDialog({ tx, kind, trigger }: { tx?: TransactionWithRelations; kind: TxType; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const catList = categories.filter((c) => c.type === (kind === "income" ? "income" : "expense"));
  const [description, setDescription] = useState(tx?.description ?? "");
  const [amount, setAmount] = useState(tx?.amount?.toString() ?? "");
  const [date, setDate] = useState<string>(tx?.date ?? new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string>(tx?.account_id ?? "");
  const [categoryId, setCategoryId] = useState<string>(tx?.category_id ?? "");
  const [status, setStatus] = useState<string>(tx?.status ?? "confirmed");
  const upsert = useUpsertTransaction();

  async function save() {
    if (!description.trim()) { toast.error("Informe uma descrição"); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Informe um valor válido"); return; }
    try {
      await upsert.mutateAsync({
        id: tx?.id,
        type: kind,
        description: description.trim(),
        amount: amt,
        date,
        account_id: accountId || null,
        category_id: categoryId || null,
        status: status as "confirmed" | "pending",
      });
      toast.success(tx ? "Transação atualizada" : "Transação criada");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{tx ? "Editar" : "Nova"} {kind === "income" ? "receita" : "despesa"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Valor</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <div className="space-y-1.5"><Label>Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
              <SelectContent>{catList.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="rounded-2xl" onClick={save} disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionsPage({
  title, description, kind, cta, badge,
}: { title: string; description: string; kind: TxType; cta: string; badge?: ReactNode }) {
  const { data: list = [], isLoading } = useTransactions(kind);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const del = useDeleteTransaction();
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filtered = useMemo(() => list.filter((t) => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (accountFilter !== "all" && t.account_id !== accountFilter) return false;
    if (categoryFilter !== "all" && t.category_id !== categoryFilter) return false;
    return true;
  }), [list, search, accountFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <TxDialog kind={kind} trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> {cta}</Button>} />
        }
      />

      {badge}

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar…" className="h-10 rounded-2xl pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 min-w-[160px] rounded-2xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.filter((c) => c.type === (kind === "income" ? "income" : "expense")).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-10 min-w-[160px] rounded-2xl"><SelectValue placeholder="Conta" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <div className="font-semibold">Nenhuma transação</div>
              <p className="mt-1 text-sm text-muted-foreground">Adicione sua primeira {kind === "income" ? "receita" : "despesa"} para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => {
                    const Icon = getIcon(t.category?.icon);
                    const catColor = t.category?.color ?? "#64748B";
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white" style={{ background: catColor }}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{t.description}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="rounded-full">{t.category?.name ?? "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{t.account?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{shortDate(t.date)}</TableCell>
                        <TableCell>
                          {t.status === "confirmed"
                            ? <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Confirmada</Badge>
                            : <Badge className="rounded-full bg-warning/15 text-warning hover:bg-warning/15">Pendente</Badge>}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${kind === "income" ? "text-success" : "text-foreground"}`}>
                          {kind === "income" ? "+" : "−"} {currency(Number(t.amount))}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <TxDialog tx={t} kind={kind} trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>} />
                            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => { if (confirm("Excluir esta transação?")) del.mutate(t.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">Mostrando {filtered.length} de {list.length} resultados</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
