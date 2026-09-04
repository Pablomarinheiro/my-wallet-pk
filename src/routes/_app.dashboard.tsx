import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NewTransactionMenu, PageHeader } from "@/components/app-shell";
import { AiInsightsCard } from "@/components/ai-insights";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight, ArrowDownRight, Plus, Wallet, PiggyBank, CreditCard,
  Target, Loader2, Calendar, ChevronLeft, ChevronRight, Filter, X, LineChart, AlertTriangle,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { currency, shortDate } from "@/lib/format";
import { getIcon } from "@/lib/icons";
import { useAuth } from "@/hooks/use-auth";
import {
  useAccounts, useBudgets, useCards, useCategories, useGoals, useTransactions,
  useCardInstallments, usePortfolioTotals,
} from "@/hooks/use-mywallet";


export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — My Wallet" }] }),
  component: Dashboard,
});

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function KpiCard({ label, value, icon: Icon, tint, hint }: {
  label: string; value: string; icon: any; tint: string; hint?: string;
}) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-soft transition-shadow hover:shadow-elevated">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tint}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {hint && <div className="mt-4 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: la } = useAccounts();
  const { data: cards = [] } = useCards();
  const { data: installments = [] } = useCardInstallments();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [], isLoading: lt } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { data: budgets = [] } = useBudgets();

  // ---- filtros + paginação da lista de transações ----
  const [fPeriod, setFPeriod] = useState("30");
  const [fAccount, setFAccount] = useState("all");
  const [fCategory, setFCategory] = useState("all");
  const [fType, setFType] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => { setPage(1); }, [fPeriod, fAccount, fCategory, fType]);


  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const filteredTx = useMemo(() => {
    const start = (() => {
      if (fPeriod === "month") return new Date(thisYear, thisMonth, 1);
      if (fPeriod === "year") return new Date(thisYear, 0, 1);
      if (fPeriod === "all") return null;
      const days = Number(fPeriod);
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    return transactions.filter((t) => {
      const d = new Date(`${t.date}T00:00:00`);
      if (start && d < start) return false;
      if (fAccount !== "all" && t.account_id !== fAccount) return false;
      if (fCategory !== "all" && t.category_id !== fCategory) return false;
      if (fType !== "all" && t.type !== fType) return false;
      return true;
    });
  }, [transactions, fPeriod, fAccount, fCategory, fType, thisMonth, thisYear, now]);

  const totalPages = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageTx = filteredTx.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersActive = fPeriod !== "30" || fAccount !== "all" || fCategory !== "all" || fType !== "all";
  const clearFilters = () => { setFPeriod("30"); setFAccount("all"); setFCategory("all"); setFType("all"); };


  const monthTx = useMemo(
    () => transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }),
    [transactions, thisMonth, thisYear],
  );

  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const liquidAccounts = accounts.filter((a) => a.type !== "investment");
  const balance = liquidAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const portfolio = usePortfolioTotals();
  const savings = income - expense;

  const cashflow = useMemo(() => {
    const buckets: Array<{ month: string; income: number; expense: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      buckets.push({ month: MONTH_LABELS[d.getMonth()], income: 0, expense: 0 });
    }
    const start = new Date(thisYear, thisMonth - 6, 1);
    for (const t of transactions) {
      const d = new Date(t.date);
      if (d < start) continue;
      const idx = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
      if (idx < 0 || idx >= buckets.length) continue;
      if (t.type === "income") buckets[idx].income += Number(t.amount);
      else if (t.type === "expense") buckets[idx].expense += Number(t.amount);
    }
    return buckets;
  }, [transactions, thisMonth, thisYear]);

  const categoryPie = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    for (const t of monthTx) {
      if (t.type !== "expense") continue;
      const key = t.category?.id ?? "none";
      const name = t.category?.name ?? "Sem categoria";
      const color = t.category?.color ?? "#64748B";
      const cur = map.get(key) ?? { name, value: 0, color };
      cur.value += Number(t.amount);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const budgetChart = useMemo(() => {
    const spentByCat = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "expense" || !t.category_id) continue;
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return budgets
      .filter((b) => b.month === thisMonth + 1 && b.year === thisYear)
      .map((b) => ({
        name: b.category_name,
        Orçado: Number(b.amount_limit),
        Gasto: b.category_id ? (spentByCat.get(b.category_id) ?? 0) : 0,
      }));
  }, [budgets, monthTx, thisMonth, thisYear]);

  const invoiceByCard = useMemo(() => {
    const m = new Map<string, number>();
    for (const inst of installments) {
      const d = new Date(`${inst.due_date}T00:00:00`);
      if (d.getMonth() !== thisMonth || d.getFullYear() !== thisYear) continue;
      m.set(inst.card_id, (m.get(inst.card_id) ?? 0) + Number(inst.amount));
    }
    return m;
  }, [installments, thisMonth, thisYear]);

  const budgetAlerts = useMemo(() => {
    const spentByCat = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "expense" || !t.category_id) continue;
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + Number(t.amount));
    }
    return budgets
      .filter((b) => b.month === thisMonth + 1 && b.year === thisYear)
      .map((b) => {
        const limit = Number(b.amount_limit);
        const spent = b.category_id ? (spentByCat.get(b.category_id) ?? 0) : 0;
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        return { id: b.id, name: b.category_name, limit, spent, pct };
      })
      .filter((b) => b.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, monthTx, thisMonth, thisYear]);

  const upcoming = useMemo(() => {
    const today = new Date(thisYear, thisMonth, now.getDate());
    const items: Array<{ id: string; date: Date; label: string; amount: number; tone: string }> = [];
    for (const t of transactions) {
      const d = new Date(t.date);
      if (t.status === "pending" && d >= today) {
        items.push({
          id: t.id, date: d, label: t.description,
          amount: Number(t.amount),
          tone: t.type === "income" ? "text-success" : "text-destructive",
        });
      }
    }
    for (const c of cards) {
      const due = new Date(thisYear, thisMonth, c.due_day);
      if (due < today) due.setMonth(due.getMonth() + 1);
      items.push({
        id: `card-${c.id}`, date: due, label: `Fatura ${c.name}`,
        amount: invoiceByCard.get(c.id) ?? 0, tone: "text-destructive",
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [transactions, cards, thisMonth, thisYear, now, invoiceByCard]);

  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? "").toString().split(" ")[0] || "usuário";
  const mainCard = cards[0];
  const monthName = MONTH_LABELS[thisMonth];

  if (la || lt) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={`${monthName} ${thisYear}`}
        title={`Olá, ${firstName} 👋`}
        description="Aqui está o resumo das suas finanças este mês."
        actions={
          <NewTransactionMenu />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Saldo disponível" value={currency(balance)} icon={Wallet} tint="bg-primary/10 text-primary" hint={`${liquidAccounts.length} conta(s) pessoal(is)`} />
        <KpiCard label="Patrimônio investido" value={currency(portfolio.current)} icon={LineChart} tint="bg-primary/10 text-primary" hint={`${portfolio.percent.toFixed(1)}% de rentabilidade`} />
        <KpiCard label="Receitas do mês" value={currency(income)} icon={ArrowUpRight} tint="bg-success/12 text-success" hint={`${monthTx.filter((t) => t.type === "income").length} entrada(s)`} />
        <KpiCard label="Despesas do mês" value={currency(expense)} icon={ArrowDownRight} tint="bg-destructive/12 text-destructive" hint={`${monthTx.filter((t) => t.type === "expense").length} saída(s)`} />
        <KpiCard label="Economia" value={currency(savings)} icon={PiggyBank} tint="bg-warning/15 text-warning" hint="Receitas − Despesas" />
      </div>

      {budgetAlerts.length > 0 && (
        <Card className="rounded-3xl border-warning/40 bg-warning/5 shadow-soft">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Alertas de orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {budgetAlerts.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {currency(b.spent)} de {currency(b.limit)}
                  </div>
                </div>
                <Badge className={b.pct >= 100
                  ? "rounded-full bg-destructive/12 text-destructive hover:bg-destructive/12"
                  : "rounded-full bg-warning/15 text-warning hover:bg-warning/15"}>
                  {b.pct >= 100 ? "Limite estourado" : "80% atingido"} · {Math.round(b.pct)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AiInsightsCard />



      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Fluxo de caixa</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Receitas vs. Despesas nos últimos 7 meses</p>
            </div>
            <div className="hidden gap-3 text-xs sm:flex">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Receitas</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Despesas</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                  <Area type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2.5} fill="url(#gInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} fill="url(#gExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gastos por categoria</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{monthName} de {thisYear}</p>
          </CardHeader>
          <CardContent>
            {categoryPie.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Sem despesas este mês</div>
            ) : (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={54} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                        {categoryPie.map((c) => <Cell key={c.name} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => currency(v)} contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-2">
                  {categoryPie.slice(0, 4).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                      </span>
                      <span className="font-semibold text-foreground">{currency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Contas</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{accounts.length} conta(s) conectada(s)</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/contas">Ver todas</Link></Button>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Você ainda não cadastrou nenhuma conta.{" "}
                <Link to="/contas" className="font-semibold text-primary">Adicionar conta</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {accounts.map((a) => (
                  <div key={a.id} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 transition-colors hover:bg-secondary/50">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ background: a.color }}>
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{currency(Number(a.balance))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Cartão principal</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Fatura em aberto</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/cartoes">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            {!mainCard ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum cartão cadastrado.{" "}
                <Link to="/cartoes" className="font-semibold text-primary">Adicionar cartão</Link>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-elevated" style={{ background: mainCard.color }}>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest text-white/60">{mainCard.name}</div>
                    <CreditCard className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="mt-6 font-mono text-base tracking-widest">•••• •••• •••• ••••</div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/60">Fatura atual</div>
                      <div className="text-lg font-bold">{currency(Number(mainCard.used))}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-white/60">Vence</div>
                      <div className="text-sm font-semibold">Dia {mainCard.due_day}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Limite usado</span>
                    <span className="font-semibold text-foreground">{currency(Number(mainCard.used))} / {currency(Number(mainCard.limit))}</span>
                  </div>
                  <Progress value={Number(mainCard.limit) > 0 ? (Number(mainCard.used) / Number(mainCard.limit)) * 100 : 0} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="space-y-3 pb-2">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Últimas transações</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filteredTx.length} resultado(s) · página {currentPage} de {totalPages}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/despesas">Ver todas</Link></Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filtros
              </span>
              <Select value={fPeriod} onValueChange={setFPeriod}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="month">Mês atual</SelectItem>
                  <SelectItem value="year">Ano atual</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fAccount} onValueChange={setFAccount}>
                <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs"><SelectValue placeholder="Conta" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fCategory} onValueChange={setFCategory}>
                <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fType} onValueChange={setFType}>
                <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                  <SelectItem value="transfer">Transferências</SelectItem>
                </SelectContent>
              </Select>
              {filtersActive && (
                <Button size="sm" variant="ghost" className="h-9 rounded-xl text-xs text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" /> Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredTx.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {transactions.length === 0 ? "Nenhuma transação ainda." : "Nenhuma transação para os filtros selecionados."}
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/70">
                  {pageTx.map((t) => {
                    const Icon = getIcon(t.category?.icon);
                    const catColor = t.category?.color ?? "#64748B";
                    return (
                      <div key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: catColor }}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{t.description}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{t.category?.name ?? "—"} · {t.account?.name ?? "—"} · {shortDate(t.date)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                            {t.type === "income" ? "+" : "−"} {currency(Number(t.amount))}
                          </div>
                          {t.status === "pending" && <Badge variant="secondary" className="mt-0.5 rounded-full bg-warning/15 px-1.5 py-0 text-[10px] text-warning">Pendente</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Exibindo {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTx.length)} de {filteredTx.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl"
                      disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[54px] text-center text-xs font-semibold text-foreground">{currentPage} / {totalPages}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl"
                      disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Próxima página">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>

        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Metas</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Progresso das metas ativas</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/metas">Ver</Link></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Sem metas cadastradas.</div>
            ) : goals.slice(0, 3).map((g) => {
              const pct = Number(g.target) > 0 ? Math.min(100, Math.round((Number(g.current) / Number(g.target)) * 100)) : 0;
              return (
                <div key={g.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white" style={{ background: g.color }}>
                        <Target className="h-4 w-4" />
                      </div>
                      <span className="truncate font-medium text-foreground">{g.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{currency(Number(g.current))}</span><span>{currency(Number(g.target))}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Orçamento vs. realizado</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Comparativo por categoria em {monthName}</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/orcamento">Ver orçamento</Link></Button>
          </CardHeader>
          <CardContent>
            {budgetChart.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Sem orçamento para este mês.{" "}
                <Link to="/orcamento" className="font-semibold text-primary">Criar orçamento</Link>
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChart} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                    <Bar dataKey="Orçado" fill="#E2E8F0" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Gasto" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calendário financeiro</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Próximos vencimentos</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                <Calendar className="mx-auto mb-2 h-6 w-6" />
                Sem vencimentos próximos.
              </div>
            ) : upcoming.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-center">
                  <div>
                    <div className="text-base font-bold leading-none text-foreground">{String(e.date.getDate()).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{MONTH_LABELS[e.date.getMonth()]}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{e.label}</div>
                  <div className="text-[11px] text-muted-foreground">Vence {e.date.toLocaleDateString("pt-BR")}</div>
                </div>
                <div className={`text-sm font-bold ${e.tone}`}>{currency(e.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* silence unused imports on empty states */}
      <div className="hidden"><Avatar><AvatarFallback>·</AvatarFallback></Avatar></div>
    </div>
  );
}
