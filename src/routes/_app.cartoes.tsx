import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Calendar, ShoppingBag } from "lucide-react";
import { cards, currency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/cartoes")({
  head: () => ({ meta: [{ title: "Cartões — My Wallet" }] }),
  component: CartoesPage,
});

const purchases = [
  { id: 1, desc: "Amazon.com.br", cat: "Compras", inst: "1/3", amount: 189.9 },
  { id: 2, desc: "iFood", cat: "Alimentação", inst: "—", amount: 68.4 },
  { id: 3, desc: "Uber", cat: "Transporte", inst: "—", amount: 32.5 },
  { id: 4, desc: "Netflix", cat: "Assinaturas", inst: "—", amount: 55.9 },
  { id: 5, desc: "Apple Store", cat: "Eletrônicos", inst: "3/10", amount: 349.0 },
];

function CartoesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        description="Acompanhe limites, faturas e compras dos seus cartões."
        actions={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo cartão</Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const avail = c.limit - c.used;
          const pct = (c.used / c.limit) * 100;
          return (
            <Card key={c.id} className="rounded-3xl border-border/70 shadow-soft">
              <CardContent className="p-5">
                <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-elevated" style={{ background: `linear-gradient(135deg, ${c.color}, oklch(from ${c.color} calc(l - 0.15) c h))` }}>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest text-white/70">{c.name}</div>
                    <CreditCard className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="mt-5 font-mono text-base tracking-widest">•••• •••• •••• {String(c.id).padStart(4, "4")}</div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/60">Fatura</div>
                      <div className="text-lg font-bold">{currency(c.used)}</div>
                    </div>
                    <Badge className="rounded-full bg-white/20 text-white hover:bg-white/25">{c.brand}</Badge>
                  </div>
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/8 blur-2xl" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Limite usado</span>
                    <span className="font-semibold text-foreground">{currency(c.used)} / {currency(c.limit)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-2xl bg-secondary/70 p-3">
                      <div className="text-[10px] uppercase text-muted-foreground">Disponível</div>
                      <div className="text-sm font-bold text-success">{currency(avail)}</div>
                    </div>
                    <div className="rounded-2xl bg-secondary/70 p-3">
                      <div className="text-[10px] uppercase text-muted-foreground">Fecha / Vence</div>
                      <div className="text-sm font-bold text-foreground">{c.closing} · {c.due}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardHeader><CardTitle className="text-base">Compras recentes — Nubank Ultravioleta</CardTitle></CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border/70">
            {purchases.map((p) => (
              <div key={p.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-foreground"><ShoppingBag className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.desc}</div>
                  <div className="text-[11px] text-muted-foreground">{p.cat}</div>
                </div>
                {p.inst !== "—" ? <Badge variant="secondary" className="rounded-full">{p.inst}</Badge> : <span />}
                <div className="text-sm font-bold text-foreground">{currency(p.amount)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
