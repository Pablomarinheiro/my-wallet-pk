import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowUpRight, ArrowDownRight, Plus, TrendingUp, TrendingDown,
  Wallet, PiggyBank, CreditCard, Target, MoreHorizontal,
  Utensils, Car, ShoppingCart, Gamepad2, HeartPulse, GraduationCap, Home as HomeIcon, Briefcase, Laptop,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  accounts, cards, cashflow, categoryPie, goals, budgets, transactions, totals, currency, shortDate,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — My Wallet" }] }),
  component: Dashboard,
});

const iconMap: Record<string, any> = {
  utensils: Utensils, car: Car, "shopping-cart": ShoppingCart,
  "gamepad-2": Gamepad2, "heart-pulse": HeartPulse, "graduation-cap": GraduationCap,
  home: HomeIcon, briefcase: Briefcase, laptop: Laptop, "trending-up": TrendingUp,
};

function KpiCard({
  label, value, delta, positive, icon: Icon, tint,
}: { label: string; value: string; delta: string; positive: boolean; icon: any; tint: string }) {
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
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
          <span className="text-muted-foreground">vs. mês anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="Julho 2026"
        title="Olá, Marina 👋"
        description="Aqui está o resumo das suas finanças este mês."
        actions={
          <>
            <Tabs defaultValue="month">
              <TabsList className="rounded-2xl">
                <TabsTrigger value="week" className="rounded-xl">Semana</TabsTrigger>
                <TabsTrigger value="month" className="rounded-xl">Mês</TabsTrigger>
                <TabsTrigger value="year" className="rounded-xl">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova transação</Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Saldo total" value={currency(totals.balance)} delta="+8,2%" positive icon={Wallet} tint="bg-primary/10 text-primary" />
        <KpiCard label="Receitas do mês" value={currency(totals.income)} delta="+12,4%" positive icon={ArrowUpRight} tint="bg-success/12 text-success" />
        <KpiCard label="Despesas do mês" value={currency(totals.expense)} delta="+3,1%" positive={false} icon={ArrowDownRight} tint="bg-destructive/12 text-destructive" />
        <KpiCard label="Economia" value={currency(totals.savings)} delta="+18,7%" positive icon={PiggyBank} tint="bg-warning/15 text-warning" />
      </div>

      {/* Charts row */}
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
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 8px 24px -8px rgba(15,23,42,.12)" }}
                    formatter={(v: number) => currency(v)}
                  />
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
            <p className="mt-1 text-xs text-muted-foreground">Julho de 2026</p>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Accounts + Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Contas</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{accounts.length} contas conectadas</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/contas">Ver todas</Link></Button>
          </CardHeader>
          <CardContent>
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
                    <div className="text-sm font-bold text-foreground">{currency(a.balance)}</div>
                    <div className="text-[11px] text-success">+2,1%</div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.22_0.03_265)] to-[oklch(0.12_0.02_265)] p-5 text-white shadow-elevated">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest text-white/60">Nubank Ultravioleta</div>
                <CreditCard className="h-5 w-5 opacity-80" />
              </div>
              <div className="mt-6 font-mono text-base tracking-widest">•••• •••• •••• 4821</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/60">Fatura atual</div>
                  <div className="text-lg font-bold">{currency(cards[0].used)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-white/60">Vence</div>
                  <div className="text-sm font-semibold">05/08</div>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/8 blur-2xl" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Limite usado</span>
                <span className="font-semibold text-foreground">{currency(cards[0].used)} / {currency(cards[0].limit)}</span>
              </div>
              <Progress value={(cards[0].used / cards[0].limit) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions + Goals + Budget */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Últimas transações</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Movimentações recentes das suas contas</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/despesas">Ver todas</Link></Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/70">
              {transactions.slice(0, 6).map((t) => {
                const Icon = iconMap[t.categoryIcon] ?? Wallet;
                return (
                  <div key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: t.categoryColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{t.description}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{t.category} · {t.account} · {shortDate(t.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                        {t.type === "income" ? "+" : "−"} {currency(t.amount)}
                      </div>
                      {t.status === "pending" && <Badge variant="secondary" className="mt-0.5 rounded-full bg-warning/15 px-1.5 py-0 text-[10px] text-warning">Pendente</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Metas</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Progresso das metas ativas</p>
              </div>
              <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/metas">Ver</Link></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
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
                      <span>{currency(g.current)}</span><span>{currency(g.target)}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Budget + Bar chart */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl border-border/70 shadow-soft xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Orçamento vs. realizado</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Comparativo por categoria em julho</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="rounded-xl text-primary"><Link to="/orcamento">Ver orçamento</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgets.map((b) => ({ name: b.category, Orçado: b.limit, Gasto: b.spent }))} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                  <Bar dataKey="Orçado" fill="#E2E8F0" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Gasto" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calendário financeiro</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Próximos vencimentos</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { d: "22", m: "Jul", label: "Fatura Itaú Click", amount: 2340, tone: "text-destructive" },
              { d: "28", m: "Jul", label: "Aluguel", amount: 2400, tone: "text-destructive" },
              { d: "05", m: "Ago", label: "Salário", amount: 8500, tone: "text-success" },
              { d: "10", m: "Ago", label: "Fatura Inter", amount: 980, tone: "text-destructive" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-center">
                  <div>
                    <div className="text-base font-bold leading-none text-foreground">{e.d}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{e.m}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{e.label}</div>
                  <div className="text-[11px] text-muted-foreground">Próximo vencimento</div>
                </div>
                <div className={`text-sm font-bold ${e.tone}`}>{currency(e.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
