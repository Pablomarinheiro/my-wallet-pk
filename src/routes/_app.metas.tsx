import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Calendar } from "lucide-react";
import { goals, currency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/metas")({
  head: () => ({ meta: [{ title: "Metas — My Wallet" }] }),
  component: MetasPage,
});

function MetasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas financeiras"
        description="Defina objetivos e acompanhe o progresso do seu planejamento."
        actions={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova meta</Button>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <Card key={g.id} className="rounded-3xl border-border/70 shadow-soft">
              <CardContent className="p-6">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: g.color }}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{g.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" /> até {new Date(g.deadline).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{pct}%</div>
                    <div className="text-[10px] uppercase text-muted-foreground">completo</div>
                  </div>
                </div>
                <div className="mt-5"><Progress value={pct} className="h-2.5" /></div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Atual</div><div className="text-sm font-bold">{currency(g.current)}</div></div>
                  <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Meta</div><div className="text-sm font-bold">{currency(g.target)}</div></div>
                  <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Falta</div><div className="text-sm font-bold text-primary">{currency(g.target - g.current)}</div></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1 rounded-2xl">Adicionar valor</Button>
                  <Button variant="outline" className="rounded-2xl">Editar</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
