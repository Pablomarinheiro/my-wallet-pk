import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Plus, Loader2, Trash2, Pencil, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { currency } from "@/lib/format";
import {
  useAccounts, useInvestments, useUpsertInvestment, useDeleteInvestment,
  useAddInvestmentTx, useInvestmentTransactions, usePortfolioTotals, type InvestmentRow,
} from "@/hooks/use-mywallet";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/investimentos")({
  head: () => ({
    meta: [
      { title: "Investimentos e patrimônio — My Wallet" },
      { name: "description", content: "Acompanhe aportes, resgates, total investido, valor atual e rentabilidade separados do saldo em conta." },
      { property: "og:title", content: "Investimentos e patrimônio — My Wallet" },
      { property: "og:description", content: "Patrimônio aplicado separado do dinheiro disponível em conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestimentosPage,
});

const TYPES = [
  { value: "fixed_income", label: "Renda fixa" },
  { value: "stock", label: "Ação" },
  { value: "fund", label: "Fundo" },
  { value: "crypto", label: "Cripto" },
  { value: "other", label: "Outro" },
] as const;

const NONE = "none";
const typeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label ?? "Outro";

function InvestmentDialog({ investment, trigger }: { investment?: InvestmentRow; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(investment?.name ?? "");
  const [type, setType] = useState<string>(investment?.type ?? "fixed_income");
  const [quantity, setQuantity] = useState(investment?.quantity?.toString() ?? "0");
  const [avgPrice, setAvgPrice] = useState(investment?.avg_price?.toString() ?? "0");
  const [currentValue, setCurrentValue] = useState(investment?.current_value?.toString() ?? "0");
  const [accountId, setAccountId] = useState(investment?.account_id ?? NONE);
  const { data: accounts = [] } = useAccounts();
  const upsert = useUpsertInvestment();

  const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;

  async function save() {
    if (!name.trim()) { toast.error("Informe o nome do ativo"); return; }
    try {
      await upsert.mutateAsync({
        id: investment?.id,
        name: name.trim(),
        type,
        quantity: num(quantity),
        avg_price: num(avgPrice),
        current_value: num(currentValue),
        account_id: accountId === NONE ? null : accountId,
      });
      toast.success(investment ? "Investimento atualizado" : "Investimento criado");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{investment ? "Editar ativo" : "Novo investimento"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Ativo</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tesouro Selic 2029" className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Conta vinculada</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem conta</SelectItem>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Quantidade</Label><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Preço médio</Label><Input value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Valor atual</Label><Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <p className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
            O valor atual é atualizado manualmente por enquanto — ainda não há cotação automática.
          </p>
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

function MovementDialog({ investment, kind, trigger }: { investment: InvestmentRow; kind: "deposit" | "withdraw"; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const add = useAddInvestmentTx();

  async function save() {
    const value = parseFloat(amount.replace(",", ".")) || 0;
    if (value <= 0) { toast.error("Informe o valor"); return; }
    try {
      await add.mutateAsync({
        investment_id: investment.id, kind, amount: value,
        quantity: parseFloat(quantity.replace(",", ".")) || 0, date,
      });
      toast.success(kind === "deposit" ? "Aporte registrado" : "Resgate registrado");
      setOpen(false); setAmount("");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-sm">
        <DialogHeader><DialogTitle>{kind === "deposit" ? "Novo aporte" : "Novo resgate"} — {investment.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Valor</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Quantidade</Label><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="rounded-2xl" onClick={save} disabled={add.isPending}>
            {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvestimentosPage() {
  const { data: investments = [], isLoading } = useInvestments();
  const { data: movements = [] } = useInvestmentTransactions();
  const totals = usePortfolioTotals();
  const del = useDeleteInvestment();

  const byInvestment = useMemo(() => {
    const m = new Map<string, number>();
    for (const mv of movements) m.set(mv.investment_id, (m.get(mv.investment_id) ?? 0) + 1);
    return m;
  }, [movements]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos"
        description="Patrimônio aplicado, separado do dinheiro disponível na conta pessoal."
        actions={<InvestmentDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo investimento</Button>} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5">
          <div className="text-xs uppercase text-muted-foreground">Total investido</div>
          <div className="mt-1 text-2xl font-bold">{currency(totals.invested)}</div>
        </CardContent></Card>
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5">
          <div className="text-xs uppercase text-muted-foreground">Valor atual</div>
          <div className="mt-1 text-2xl font-bold">{currency(totals.current)}</div>
        </CardContent></Card>
        <Card className="rounded-3xl border-border/70 shadow-soft"><CardContent className="p-5">
          <div className="text-xs uppercase text-muted-foreground">Rentabilidade</div>
          <div className={`mt-1 text-2xl font-bold ${totals.profit >= 0 ? "text-success" : "text-destructive"}`}>
            {currency(totals.profit)}
          </div>
          <div className="text-xs text-muted-foreground">{totals.percent.toFixed(2)}%</div>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : investments.length === 0 ? (
        <Card className="rounded-3xl border-dashed"><CardContent className="p-10 text-center">
          <LineChart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">Nenhum investimento cadastrado</div>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre seus ativos para separar patrimônio aplicado do saldo em conta.</p>
          <div className="mt-4"><InvestmentDialog trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Novo investimento</Button>} /></div>
        </CardContent></Card>
      ) : (
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Carteira</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {investments.map((i) => {
              const invested = Number(i.avg_price) * Number(i.quantity);
              const current = Number(i.current_value);
              const profit = current - invested;
              const pct = invested > 0 ? (profit / invested) * 100 : 0;
              return (
                <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Number(i.quantity)} un · preço médio {currency(Number(i.avg_price))} · {byInvestment.get(i.id) ?? 0} movimentação(ões)
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full">{typeLabel(i.type)}</Badge>
                  <div className="text-right">
                    <div className="text-sm font-bold">{currency(current)}</div>
                    <div className={`text-[11px] ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {profit >= 0 ? "+" : ""}{currency(profit)} · {pct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <MovementDialog investment={i} kind="deposit" trigger={<Button variant="ghost" size="icon" aria-label="Aportar"><ArrowDownToLine className="h-4 w-4" /></Button>} />
                    <MovementDialog investment={i} kind="withdraw" trigger={<Button variant="ghost" size="icon" aria-label="Resgatar"><ArrowUpFromLine className="h-4 w-4" /></Button>} />
                    <InvestmentDialog investment={i} trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>} />
                    <Button variant="ghost" size="icon" aria-label="Excluir"
                      onClick={() => { if (confirm(`Excluir "${i.name}"?`)) del.mutate(i.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
