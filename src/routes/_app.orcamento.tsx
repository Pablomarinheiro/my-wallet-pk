import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, PiggyBank } from "lucide-react";
import { currency } from "@/lib/format";
import { getIcon } from "@/lib/icons";
import {
  useBudgets, useCategories, useTransactions, useUpsertBudget, useDeleteBudget,
  type BudgetRow,
} from "@/hooks/use-mywallet";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orcamento")({
  head: () => ({ meta: [{ title: "Orçamento — My Wallet" }] }),
  component: OrcamentoPage,
});

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function BudgetDialog({
  budget, trigger, defaultMonth, defaultYear,
}: { budget?: BudgetRow; trigger: ReactNode; defaultMonth: number; defaultYear: number }) {
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const expenseCats = categories.filter((c) => c.type === "expense");
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? "");
  const [limit, setLimit] = useState(budget?.amount_limit?.toString() ?? "");
  const [month, setMonth] = useState(budget?.month ?? defaultMonth);
  const [year, setYear] = useState(budget?.year ?? defaultYear);
  const upsert = useUpsertBudget();

  async function save() {
    const cat = expenseCats.find((c) => c.id === categoryId);
    if (!cat) { toast.error("Selecione uma categoria"); return; }
    const v = parseFloat(limit);
    if (!v || v <= 0) { toast.error("Limite inválido"); return; }
    try {
      await upsert.mutateAsync({
        id: budget?.id,
        category_id: cat.id,
        category_name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount_limit: v,
        month,
        year,
      });
      toast.success(budget ? "Orçamento atualizado" : "Orçamento criado");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{budget ? "Editar orçamento" : "Novo orçamento"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Limite mensal</Label><Input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Ano</Label><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-2xl" /></div>
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

function OrcamentoPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: budgetsAll = [], isLoading } = useBudgets();
  const { data: transactions = [] } = useTransactions("expense");
  const del = useDeleteBudget();

  const budgets = useMemo(
    () => budgetsAll.filter((b) => b.month === month && b.year === year),
    [budgetsAll, month, year],
  );

  const spentByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const d = new Date(t.date);
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
      if (!t.category_id) continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return map;
  }, [transactions, month, year]);

  const totalLimit = budgets.reduce((s, b) => s + Number(b.amount_limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.category_id ? (spentByCat.get(b.category_id) ?? 0) : 0), 0);
  const pct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamento mensal"
        description="Defina limites por categoria e mantenha suas finanças no rumo."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-10 w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 w-24 rounded-2xl" />
            <BudgetDialog defaultMonth={month} defaultYear={year} trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo orçamento</Button>} />
          </div>
        }
      />

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div><div className="text-xs text-muted-foreground">Limite total</div><div className="text-2xl font-bold">{currency(totalLimit)}</div></div>
            <div><div className="text-xs text-muted-foreground">Gasto até agora</div><div className="text-2xl font-bold text-destructive">{currency(totalSpent)}</div></div>
            <div><div className="text-xs text-muted-foreground">Disponível</div><div className="text-2xl font-bold text-success">{currency(Math.max(0, totalLimit - totalSpent))}</div></div>
          </div>
          <div className="mt-5"><Progress value={Math.min(pct, 100)} className="h-3" /></div>
          <div className="mt-2 text-xs text-muted-foreground">{pct}% do orçamento utilizado</div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : budgets.length === 0 ? (
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="grid place-items-center gap-3 py-16 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground" />
            <div className="font-semibold">Sem orçamento para {MONTHS[month - 1]} de {year}</div>
            <p className="max-w-sm text-sm text-muted-foreground">Defina limites por categoria e acompanhe o quanto está gastando ao longo do mês.</p>
            <BudgetDialog defaultMonth={month} defaultYear={year} trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Novo orçamento</Button>} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const lim = Number(b.amount_limit);
            const spent = b.category_id ? (spentByCat.get(b.category_id) ?? 0) : 0;
            const p = lim > 0 ? Math.round((spent / lim) * 100) : 0;
            const over = spent > lim;
            const Icon = getIcon(b.icon);
            return (
              <Card key={b.id} className="rounded-3xl border-border/70 shadow-soft">
                <CardContent className="p-5">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: b.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{b.category_name}</div>
                      <div className="text-[11px] text-muted-foreground">Limite: {currency(lim)}</div>
                    </div>
                    {over
                      ? <Badge className="rounded-full bg-destructive/12 text-destructive hover:bg-destructive/12">Excedido</Badge>
                      : p >= 80 ? <Badge className="rounded-full bg-warning/15 text-warning hover:bg-warning/15">Atenção</Badge>
                      : <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Ok</Badge>}
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div className="text-xl font-bold">{currency(spent)}</div>
                    <div className="text-xs text-muted-foreground">{p}%</div>
                  </div>
                  <Progress value={Math.min(p, 100)} className="mt-2 h-2" />
                  <div className="mt-2 text-[11px] text-muted-foreground">Disponível: {currency(Math.max(0, lim - spent))}</div>
                  <div className="mt-4 flex gap-2">
                    <BudgetDialog budget={b} defaultMonth={month} defaultYear={year} trigger={<Button variant="outline" className="flex-1 rounded-2xl"><Pencil className="h-4 w-4" /> Editar</Button>} />
                    <Button variant="outline" className="rounded-2xl text-destructive" onClick={() => { if (confirm(`Excluir orçamento de ${b.category_name}?`)) del.mutate(b.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
