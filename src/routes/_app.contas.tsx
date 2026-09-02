import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, TrendingUp, Building2, Banknote, Pencil, Trash2, Loader2 } from "lucide-react";
import { currency } from "@/lib/format";
import { COLOR_OPTIONS } from "@/lib/icons";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAccounts, useDeleteAccount, useUpsertAccount, type AccountRow } from "@/hooks/use-mywallet";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/contas")({
  head: () => ({ meta: [{ title: "Contas — My Wallet" }] }),
  component: ContasPage,
});

const TYPES = ["Conta Corrente", "Carteira", "Dinheiro", "Investimento"] as const;
const typeIcon: Record<string, any> = {
  "Conta Corrente": Building2, Carteira: Wallet, Dinheiro: Banknote, Investimento: TrendingUp,
};

function AccountDialog({ account, trigger }: { account?: AccountRow; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(account?.name ?? "");
  const [bank, setBank] = useState(account?.bank ?? "");
  const [type, setType] = useState<string>(account?.type ?? "Conta Corrente");
  const [balance, setBalance] = useState<string>(account?.balance?.toString() ?? "0");
  const [color, setColor] = useState(account?.color ?? COLOR_OPTIONS[0]);
  const upsert = useUpsertAccount();

  async function save() {
    if (!name.trim()) { toast.error("Informe um nome"); return; }
    try {
      await upsert.mutateAsync({
        id: account?.id,
        name: name.trim(),
        bank: bank || null,
        type,
        balance: parseFloat(balance) || 0,
        color,
      });
      toast.success(account ? "Conta atualizada" : "Conta criada");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{account ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank" className="rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Banco / Instituição</Label><Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Nubank, Itaú…" className="rounded-2xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Saldo</Label><Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className="rounded-2xl" /></div>
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

function ContasPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const del = useDeleteAccount();
  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        description="Gerencie suas contas bancárias, carteiras e investimentos."
        actions={
          <AccountDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova conta</Button>} />
        }
      />

      <Card className="rounded-3xl border-border/70 bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.22_262)] text-primary-foreground shadow-elevated">
        <CardContent className="p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-white/70">Patrimônio total</div>
          <div className="mt-1 text-3xl font-bold md:text-4xl">{currency(total)}</div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div><span className="text-white/70">Contas: </span><span className="font-semibold">{accounts.length}</span></div>
            <div><span className="text-white/70">Investido: </span><span className="font-semibold">{currency(accounts.filter(a => a.type === "Investimento").reduce((s, a) => s + Number(a.balance), 0))}</span></div>
            <div><span className="text-white/70">Disponível: </span><span className="font-semibold">{currency(accounts.filter(a => a.type !== "Investimento").reduce((s, a) => s + Number(a.balance), 0))}</span></div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : accounts.length === 0 ? (
        <Card className="rounded-3xl border-dashed"><CardContent className="p-10 text-center">
          <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">Nenhuma conta cadastrada</div>
          <p className="mt-1 text-sm text-muted-foreground">Adicione sua primeira conta para começar a acompanhar seu saldo.</p>
          <div className="mt-4"><AccountDialog trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Nova conta</Button>} /></div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => {
            const Icon = typeIcon[a.type] ?? Wallet;
            return (
              <Card key={a.id} className="rounded-3xl border-border/70 shadow-soft transition-shadow hover:shadow-elevated">
                <CardContent className="p-5">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: a.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.bank || "—"}</div>
                    </div>
                    <div className="flex gap-1">
                      <AccountDialog account={a} trigger={<Button variant="ghost" size="icon" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>} />
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => { if (confirm(`Excluir conta "${a.name}"?`)) del.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground">Saldo atual</div>
                    <div className="text-2xl font-bold tracking-tight text-foreground">{currency(Number(a.balance))}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary" className="rounded-full">{a.type}</Badge>
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
