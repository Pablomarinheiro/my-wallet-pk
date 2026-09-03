import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Plus, Pencil, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { currency } from "@/lib/format";
import { COLOR_OPTIONS } from "@/lib/icons";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useCards, useDeleteCard, useUpsertCard, useCardPurchases, useUpsertCardPurchase,
  useDeleteCardPurchase, useCategories, type CardRow,
} from "@/hooks/use-mywallet";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cartoes")({
  head: () => ({
    meta: [
      { title: "Cartões e faturas — My Wallet" },
      { name: "description", content: "Controle limites, compras parceladas e a fatura calculada de cada cartão de crédito." },
      { property: "og:title", content: "Cartões e faturas — My Wallet" },
      { property: "og:description", content: "Compras parceladas com fatura recalculada automaticamente por ciclo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartoesPage,
});

const BRANDS = ["Visa", "Mastercard", "Elo"] as const;
const NONE = "none";

function monthKey(d: string | Date) {
  const dt = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function CardDialog({ card, trigger }: { card?: CardRow; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(card?.name ?? "");
  const [brand, setBrand] = useState<string>(card?.brand ?? "Visa");
  const [limit, setLimit] = useState(card?.limit?.toString() ?? "0");
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
        brand,
        limit: parseFloat(limit) || 0,
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Fecha (dia)</Label><Input type="number" min={1} max={31} value={closing} onChange={(e) => setClosing(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Vence (dia)</Label><Input type="number" min={1} max={31} value={due} onChange={(e) => setDue(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <p className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
            A fatura não é mais digitada: ela é calculada pelas parcelas que vencem no ciclo do cartão.
          </p>
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

function PurchaseDialog({ cards, trigger }: { cards: CardRow[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(NONE);
  const [hasInterest, setHasInterest] = useState(false);
  const [rate, setRate] = useState("0");
  const { data: categories = [] } = useCategories();
  const upsert = useUpsertCardPurchase();

  async function save() {
    if (!cardId) { toast.error("Selecione um cartão"); return; }
    if (!description.trim()) { toast.error("Informe a descrição"); return; }
    const amount = parseFloat(total.replace(",", ".")) || 0;
    if (amount <= 0) { toast.error("Informe o valor total"); return; }
    try {
      await upsert.mutateAsync({
        card_id: cardId,
        description: description.trim(),
        merchant: merchant.trim() || null,
        total_amount: amount,
        installments: Math.max(parseInt(installments) || 1, 1),
        purchase_date: date,
        category_id: categoryId === NONE ? null : categoryId,
        has_interest: hasInterest,
        interest_rate: hasInterest ? parseFloat(rate.replace(",", ".")) || 0 : 0,
      });
      toast.success("Compra registrada — parcelas geradas");
      setOpen(false);
      setDescription(""); setMerchant(""); setTotal(""); setInstallments("1");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>Nova compra no cartão</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Cartão</Label>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Descrição</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-2xl" placeholder="Notebook" /></div>
            <div className="space-y-1.5"><Label>Loja</Label><Input value={merchant} onChange={(e) => setMerchant(e.target.value)} className="rounded-2xl" placeholder="Amazon" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Valor total</Label><Input value={total} onChange={(e) => setTotal(e.target.value)} className="rounded-2xl" placeholder="0,00" /></div>
            <div className="space-y-1.5"><Label>Parcelas</Label><Input type="number" min={1} max={72} value={installments} onChange={(e) => setInstallments(e.target.value)} className="rounded-2xl" /></div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl" /></div>
          </div>
          <div className="space-y-1.5"><Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem categoria</SelectItem>
                {categories.filter((c) => c.type === "expense").map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3">
            <div>
              <div className="text-sm font-medium">Compra com juros</div>
              <div className="text-xs text-muted-foreground">Aplica a taxa sobre o valor total</div>
            </div>
            <Switch checked={hasInterest} onCheckedChange={setHasInterest} />
          </div>
          {hasInterest && (
            <div className="space-y-1.5"><Label>Taxa total de juros (%)</Label><Input value={rate} onChange={(e) => setRate(e.target.value)} className="rounded-2xl" /></div>
          )}
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
  const { data: purchases = [] } = useCardPurchases();
  const del = useDeleteCard();
  const delPurchase = useDeleteCardPurchase();
  const thisMonth = monthKey(new Date());

  const byCard = useMemo(() => {
    const m = new Map<string, { invoice: number; openTotal: number }>();
    for (const p of purchases) {
      const entry = m.get(p.card_id) ?? { invoice: 0, openTotal: 0 };
      for (const inst of p.card_installments ?? []) {
        if (monthKey(inst.due_date) === thisMonth) entry.invoice += Number(inst.amount);
        if (!inst.paid) entry.openTotal += Number(inst.amount);
      }
      m.set(p.card_id, entry);
    }
    return m;
  }, [purchases, thisMonth]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        description="Faturas calculadas pelas parcelas em aberto de cada cartão."
        actions={
          <div className="flex gap-2">
            {cards.length > 0 && (
              <PurchaseDialog cards={cards} trigger={<Button variant="outline" className="rounded-2xl"><ShoppingBag className="h-4 w-4" /> Nova compra</Button>} />
            )}
            <CardDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Novo cartão</Button>} />
          </div>
        }
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
            const totals = byCard.get(c.id) ?? { invoice: 0, openTotal: 0 };
            const avail = limit - totals.openTotal;
            const pct = limit > 0 ? (totals.openTotal / limit) * 100 : 0;
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
                        <div className="text-[10px] uppercase tracking-wider text-white/60">Fatura deste mês</div>
                        <div className="text-lg font-bold">{currency(totals.invoice)}</div>
                      </div>
                      <Badge className="rounded-full bg-white/20 text-white hover:bg-white/25">{c.brand}</Badge>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Limite comprometido</span>
                      <span className="font-semibold text-foreground">{currency(totals.openTotal)} / {currency(limit)}</span>
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

      {purchases.length > 0 && (
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardHeader><CardTitle className="text-base">Compras em aberto</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {purchases.map((p) => {
              const insts = p.card_installments ?? [];
              const open = insts.filter((i) => !i.paid).sort((a, b) => a.due_date.localeCompare(b.due_date));
              if (open.length === 0) return null;
              const next = open[0]!;
              const card = cards.find((c) => c.id === p.card_id);
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.merchant || p.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.merchant ? `${p.description} · ` : ""}{card?.name ?? "Cartão"} · vence {new Date(`${next.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full">{next.number}/{next.total}</Badge>
                  {p.has_interest && (
                    <Badge className="rounded-full bg-warning/15 text-warning hover:bg-warning/15">
                      juros {Number(p.interest_rate)}%
                    </Badge>
                  )}
                  <div className="text-right">
                    <div className="text-sm font-bold">{currency(Number(next.amount))}</div>
                    <div className="text-[11px] text-muted-foreground">total {currency(Number(p.total_amount))}</div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Excluir compra"
                    onClick={() => { if (confirm(`Excluir a compra "${p.description}"?`)) delPurchase.mutate(p.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
