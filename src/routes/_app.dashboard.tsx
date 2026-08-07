import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
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
  Target, Loader2, Calendar, ChevronLeft, ChevronRight, Filter, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { currency, shortDate } from "@/lib/mock-data";
import { getIcon } from "@/lib/icons";
import { useAuth } from "@/hooks/use-auth";
import {
  useAccounts, useBudgets, useCards, useCategories, useGoals, useTransactions,
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

  const monthTx = useMemo(
    () => transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }),
    [transactions, thisMonth, thisYear],
  );

  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = accounts.reduce((s, a) => s + Number(a.balance), 0);
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
        amount: Number(c.used), tone: "text-destructive",
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [transactions, cards, thisMonth, thisYear, now]);

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
          <Button asChild className="rounded-2xl shadow-soft"><Link to="/despesas"><Plus className="h-4 w-4" /> Nova transação</Link></Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo total" value={currency(balance)} icon={Wallet} tint="bg-primary/10 text-primary" hint={`${accounts.length} conta(s)`} />
        <KpiCard label="Receitas do mês" value={currency(income)} icon={ArrowUpRight} tint="bg-success/12 text-success" hint={`${monthTx.filter((t) => t.type === "income").length} entrada(s)`} />
        <KpiCard label="Despesas do mês" value={currency(expense)} icon={ArrowDownRight} tint="bg-destructive/12 text-destructive" hint={`${monthTx.filter((t) => t.type === "expense").length} saída(s)`} />
        <KpiCard label="Economia" value={currency(savings)} icon={PiggyBank} tint="bg-warning/15 text-warning" hint="Receitas − Despesas" />
      </div>

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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Últimas transações</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Movimentações recentes</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/despesas">Ver todas</Link></Button>
          </CardHeader>
          <CardContent className="pt-0">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação ainda.</div>
            ) : (
              <div className="divide-y divide-border/70">
                {transactions.slice(0, 6).map((t) => {
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
