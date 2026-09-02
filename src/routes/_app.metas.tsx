import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Target, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { currency } from "@/lib/format";
import { COLOR_OPTIONS } from "@/lib/icons";
import {
  useGoals, useUpsertGoal, useDeleteGoal, type GoalRow,
} from "@/hooks/use-mywallet";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/metas")({
  head: () => ({ meta: [{ title: "Metas — My Wallet" }] }),
  component: MetasPage,
});

function GoalDialog({ goal, trigger }: { goal?: GoalRow; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target?.toString() ?? "");
  const [current, setCurrent] = useState(goal?.current?.toString() ?? "0");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [color, setColor] = useState(goal?.color ?? COLOR_OPTIONS[0]);
  const upsert = useUpsertGoal();

  async function save() {
    if (!name.trim()) { toast.error("Informe um nome"); return; }
    const t = parseFloat(target);
    if (!t || t <= 0) { toast.error("Valor alvo inválido"); return; }
    try {
      await upsert.mutateAsync({
        id: goal?.id,
        name: name.trim(),
        target: t,
        current: parseFloat(current) || 0,
        deadline: deadline || null,
        color,
      });
      toast.success(goal ? "Meta atualizada" : "Meta criada");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Valor alvo</Label><Input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Valor atual</Label><Input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <div className="space-y-1.5"><Label>Prazo</Label><Input type="date" value={deadline ?? ""} onChange={(e) => setDeadline(e.target.value)} className="rounded-2xl" /></div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} aria-label={c} />
              ))}
            </div>
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

function MetasPage() {
  const { data: goals = [], isLoading } = useGoals();
  const del = useDeleteGoal();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas financeiras"
        description="Defina objetivos e acompanhe o progresso do seu planejamento."
        actions={<GoalDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova meta</Button>} />}
      />
      {isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : goals.length === 0 ? (
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="grid place-items-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground" />
            <div className="font-semibold">Nenhuma meta cadastrada</div>
            <p className="max-w-sm text-sm text-muted-foreground">Crie sua primeira meta financeira e acompanhe o progresso ao longo do tempo.</p>
            <GoalDialog trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Nova meta</Button>} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const target = Number(g.target);
            const curr = Number(g.current);
            const pct = target > 0 ? Math.min(100, Math.round((curr / target) * 100)) : 0;
            return (
              <Card key={g.id} className="rounded-3xl border-border/70 shadow-soft">
                <CardContent className="p-6">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: g.color }}>
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{g.name}</div>
                      {g.deadline && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" /> até {new Date(g.deadline).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{pct}%</div>
                      <div className="text-[10px] uppercase text-muted-foreground">completo</div>
                    </div>
                  </div>
                  <div className="mt-5"><Progress value={pct} className="h-2.5" /></div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Atual</div><div className="text-sm font-bold">{currency(curr)}</div></div>
                    <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Meta</div><div className="text-sm font-bold">{currency(target)}</div></div>
                    <div className="rounded-2xl bg-secondary/70 p-3"><div className="text-[10px] uppercase text-muted-foreground">Falta</div><div className="text-sm font-bold text-primary">{currency(Math.max(0, target - curr))}</div></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <GoalDialog goal={g} trigger={<Button variant="outline" className="flex-1 rounded-2xl"><Pencil className="h-4 w-4" /> Editar</Button>} />
                    <Button variant="outline" className="rounded-2xl text-destructive" onClick={() => { if (confirm(`Excluir a meta "${g.name}"?`)) del.mutate(g.id); }}>
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
