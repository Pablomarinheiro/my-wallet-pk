import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, ArrowRight, Plus } from "lucide-react";
import { accounts, currency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/transferencias")({
  head: () => ({ meta: [{ title: "Transferências — My Wallet" }] }),
  component: TransferPage,
});

const history = [
  { id: 1, from: "Itaú Salário", to: "Conta Nubank", amount: 1200, date: "12 jul" },
  { id: 2, from: "Conta Nubank", to: "Investimentos XP", amount: 3000, date: "05 jul" },
  { id: 3, from: "Itaú Salário", to: "Carteira", amount: 200, date: "02 jul" },
];

function TransferPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferências"
        description="Movimente valores entre suas contas."
        actions={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova transferência</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary"><ArrowLeftRight className="h-4 w-4" /></div>
              <div className="text-base font-semibold">Nova transferência</div>
            </div>
            <div className="space-y-1.5">
              <Label>Conta de origem</Label>
              <Select defaultValue={accounts[0].id}><SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} — {currency(a.balance)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta de destino</Label>
              <Select defaultValue={accounts[1].id}><SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valor</Label><Input placeholder="R$ 0,00" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5"><Label>Data</Label><Input type="date" className="h-11 rounded-2xl" /></div>
            </div>
            <div className="space-y-1.5"><Label>Observação</Label><Input placeholder="Ex.: Reserva mensal" className="h-11 rounded-2xl" /></div>
            <Button className="h-11 w-full rounded-2xl shadow-soft">Confirmar transferência</Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="p-6">
            <div className="mb-4 text-base font-semibold">Histórico</div>
            <div className="divide-y divide-border/70">
              {history.map((h) => (
                <div key={h.id} className="grid grid-cols-[1fr_auto] gap-3 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{h.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{h.to}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{currency(h.amount)}</div>
                    <div className="text-[11px] text-muted-foreground">{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
