import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, MoreHorizontal, TrendingUp, Building2, Coins, Banknote } from "lucide-react";
import { accounts, currency } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/contas")({
  head: () => ({ meta: [{ title: "Contas — My Wallet" }] }),
  component: ContasPage,
});

const typeIcon: Record<string, any> = {
  "Conta Corrente": Building2, Carteira: Wallet, Dinheiro: Banknote, Investimento: TrendingUp,
};

function ContasPage() {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        description="Gerencie suas contas bancárias, carteiras e investimentos."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova conta</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-md">
              <DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Ex.: Nubank" className="rounded-2xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Tipo</Label>
                    <Select><SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cc">Conta Corrente</SelectItem>
                        <SelectItem value="ct">Carteira</SelectItem>
                        <SelectItem value="di">Dinheiro</SelectItem>
                        <SelectItem value="in">Investimento</SelectItem>
                      </SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label>Saldo inicial</Label><Input placeholder="R$ 0,00" className="rounded-2xl" /></div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" className="rounded-2xl">Cancelar</Button><Button className="rounded-2xl">Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="rounded-3xl border-border/70 bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.22_262)] text-primary-foreground shadow-elevated">
        <CardContent className="p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-white/70">Patrimônio total</div>
          <div className="mt-1 text-3xl font-bold md:text-4xl">{currency(total)}</div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div><span className="text-white/70">Contas: </span><span className="font-semibold">{accounts.length}</span></div>
            <div><span className="text-white/70">Investido: </span><span className="font-semibold">{currency(accounts.filter(a => a.type === "Investimento").reduce((s, a) => s + a.balance, 0))}</span></div>
            <div><span className="text-white/70">Disponível: </span><span className="font-semibold">{currency(accounts.filter(a => a.type !== "Investimento").reduce((s, a) => s + a.balance, 0))}</span></div>
          </div>
        </CardContent>
      </Card>

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
                    <div className="text-[11px] text-muted-foreground">{a.bank}</div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Opções da conta"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">Saldo atual</div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">{currency(a.balance)}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary" className="rounded-full">{a.type}</Badge>
                  <Button variant="ghost" size="sm" className="rounded-xl text-primary">Detalhes</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
