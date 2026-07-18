import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Utensils, Car, ShoppingCart, Gamepad2, HeartPulse, GraduationCap } from "lucide-react";
import { budgets, currency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/orcamento")({
  head: () => ({ meta: [{ title: "Orçamento — My Wallet" }] }),
  component: OrcamentoPage,
});

const iconMap: Record<string, any> = {
  utensils: Utensils, car: Car, "shopping-cart": ShoppingCart,
  "gamepad-2": Gamepad2, "heart-pulse": HeartPulse, "graduation-cap": GraduationCap,
};

function OrcamentoPage() {
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const pct = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamento mensal"
        description="Defina limites por categoria e mantenha suas finanças no rumo."
        actions={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo orçamento</Button>}
      />

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div><div className="text-xs text-muted-foreground">Limite total</div><div className="text-2xl font-bold">{currency(totalLimit)}</div></div>
            <div><div className="text-xs text-muted-foreground">Gasto até agora</div><div className="text-2xl font-bold text-destructive">{currency(totalSpent)}</div></div>
            <div><div className="text-xs text-muted-foreground">Disponível</div><div className="text-2xl font-bold text-success">{currency(totalLimit - totalSpent)}</div></div>
          </div>
          <div className="mt-5"><Progress value={pct} className="h-3" /></div>
          <div className="mt-2 text-xs text-muted-foreground">{pct}% do orçamento utilizado</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((b) => {
          const p = Math.round((b.spent / b.limit) * 100);
          const over = b.spent > b.limit;
          const Icon = iconMap[b.icon] ?? Utensils;
          return (
            <Card key={b.id} className="rounded-3xl border-border/70 shadow-soft">
              <CardContent className="p-5">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: b.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{b.category}</div>
                    <div className="text-[11px] text-muted-foreground">Limite: {currency(b.limit)}</div>
                  </div>
                  {over
                    ? <Badge className="rounded-full bg-destructive/12 text-destructive hover:bg-destructive/12">Excedido</Badge>
                    : p >= 80 ? <Badge className="rounded-full bg-warning/15 text-warning hover:bg-warning/15">Atenção</Badge>
                    : <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Ok</Badge>}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="text-xl font-bold">{currency(b.spent)}</div>
                  <div className="text-xs text-muted-foreground">{p}%</div>
                </div>
                <Progress value={Math.min(p, 100)} className="mt-2 h-2" />
                <div className="mt-2 text-[11px] text-muted-foreground">Disponível: {currency(Math.max(0, b.limit - b.spent))}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
