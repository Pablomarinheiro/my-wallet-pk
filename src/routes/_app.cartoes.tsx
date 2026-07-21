import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { currency } from "@/lib/mock-data";
import { COLOR_OPTIONS } from "@/lib/icons";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCards, useDeleteCard, useUpsertCard, type CardRow } from "@/hooks/use-mywallet";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cartoes")({
  head: () => ({ meta: [{ title: "Cartões — My Wallet" }] }),
  component: CartoesPage,
});

const BRANDS = ["Visa", "Mastercard", "Elo"] as const;

function CardDialog({ card, trigger }: { card?: CardRow; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(card?.name ?? "");
  const [brand, setBrand] = useState<string>(card?.brand ?? "Visa");
  const [limit, setLimit] = useState(card?.limit?.toString() ?? "0");
  const [used, setUsed] = useState(card?.used?.toString() ?? "0");
  const [closing, setClosing] = useState(card?.closing_day?.toString() ?? "1");
  const [due, setDue] = useState(card?.due_day?.toString() ?? "10");
  const [color, setColor] = useState(card?.color ?? "#111827");
  const upsert = useUpsertCard();

  async function save() {
    if (!name.trim()) { toast.error("Informe um nome"); return; }
    try {
      await upsert.mutateAsync({
        id: card?.id,
        name: name.trim(),
        brand: brand as CardRow["brand"],
        limit: parseFloat(limit) || 0,
        used: parseFloat(used) || 0,
        closing_day: parseInt(closing) || 1,
        due_day: parseInt(due) || 10,
        color,
      });
      toast.success(card ? "Cartão atualizado" : "Cartão criado");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank Ultravioleta" className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Bandeira</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Limite</Label><Input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Usado</Label><Input type="number" step="0.01" value={used} onChange={(e) => setUsed(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Fecha (dia)</Label><Input type="number" min={1} max={31} value={closing} onChange={(e) => setClosing(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Vence (dia)</Label><Input type="number" min={1} max={31} value={due} onChange={(e) => setDue(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <div className="space-y-1.5"><Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} aria-label={c} />
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

function CartoesPage() {
  const { data: cards = [], isLoading } = useCards();
  const del = useDeleteCard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        description="Acompanhe limites, faturas e compras dos seus cartões."
        actions={<CardDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo cartão</Button>} />}
      />

      {isLoading ? (
        <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : cards.length === 0 ? (
        <Card className="rounded-3xl border-dashed"><CardContent className="p-10 text-center">
          <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">Nenhum cartão cadastrado</div>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre seus cartões para acompanhar limites e faturas.</p>
          <div className="mt-4"><CardDialog trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Novo cartão</Button>} /></div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const limit = Number(c.limit);
            const used = Number(c.used);
            const avail = limit - used;
            const pct = limit > 0 ? (used / limit) * 100 : 0;
            return (
              <Card key={c.id} className="rounded-3xl border-border/70 shadow-soft">
                <CardContent className="p-5">
                  <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-elevated" style={{ background: `linear-gradient(135deg, ${c.color}, oklch(from ${c.color} calc(l - 0.15) c h))` }}>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] uppercase tracking-widest text-white/70">{c.name}</div>
                      <CreditCard className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="mt-5 font-mono text-base tracking-widest">•••• •••• •••• {c.id.slice(0, 4).toUpperCase()}</div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/60">Fatura</div>
                        <div className="text-lg font-bold">{currency(used)}</div>
                      </div>
                      <Badge className="rounded-full bg-white/20 text-white hover:bg-white/25">{c.brand}</Badge>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Limite usado</span>
                      <span className="font-semibold text-foreground">{currency(used)} / {currency(limit)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">Disponível</div>
                        <div className="text-sm font-bold text-success">{currency(avail)}</div>
                      </div>
                      <div className="rounded-2xl bg-secondary/70 p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">Fecha / Vence</div>
                        <div className="text-sm font-bold text-foreground">{c.closing_day} · {c.due_day}</div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <CardDialog card={c} trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>} />
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => { if (confirm(`Excluir cartão "${c.name}"?`)) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
