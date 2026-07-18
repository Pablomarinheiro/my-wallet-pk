import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, FileSpreadsheet, FileType2 } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Line, LineChart, Legend,
} from "recharts";
import { cashflow, currency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — My Wallet" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Analise seu histórico financeiro e exporte para PDF, Excel ou CSV."
        actions={<Button className="rounded-2xl shadow-soft"><Download className="h-4 w-4" /> Gerar relatório</Button>}
      />

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="grid grid-cols-1 gap-3 p-5 md:grid-cols-5">
          <div className="space-y-1.5"><Label>Período</Label>
            <Select defaultValue="30"><SelectTrigger className="h-10 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="90">Últimos 90 dias</SelectItem><SelectItem value="365">Últimos 12 meses</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>De</Label><Input type="date" className="h-10 rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Até</Label><Input type="date" className="h-10 rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Conta</Label>
            <Select><SelectTrigger className="h-10 rounded-2xl"><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>Categoria</Label>
            <Select><SelectTrigger className="h-10 rounded-2xl"><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Evolução mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashflow} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Receitas" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Comparativo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(215 20% 92%)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E2E8F0" }} formatter={(v: number) => currency(v)} />
                  <Bar dataKey="income" name="Receitas" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardHeader><CardTitle className="text-base">Exportar</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { icon: FileType2, label: "PDF", desc: "Relatório visual pronto para imprimir" },
            { icon: FileSpreadsheet, label: "Excel", desc: "Planilha com todos os dados" },
            { icon: FileText, label: "CSV", desc: "Dados brutos separados por vírgula" },
          ].map((e) => (
            <button key={e.label} className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"><e.icon className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="text-sm font-semibold">{e.label}</div><div className="text-[11px] text-muted-foreground">{e.desc}</div></div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
