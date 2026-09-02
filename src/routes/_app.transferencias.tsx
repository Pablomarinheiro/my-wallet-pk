import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { currency, shortDate } from "@/lib/format";
import { toast } from "sonner";
import {
  useAccounts, useDeleteTransaction, useTransactions, useUpsertTransaction,
} from "@/hooks/use-mywallet";

export const Route = createFileRoute("/_app/transferencias")({
  head: () => ({
    meta: [
      { title: "Transferências — My Wallet" },
      { name: "description", content: "Movimente valores entre suas contas no My Wallet." },
    ],
  }),
  component: TransferPage,
});

function TransferPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: list = [], isLoading } = useTransactions("transfer");
  const upsert = useUpsertTransaction();
  const del = useDeleteTransaction();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const accountName = useMemo(() => {
    const m = new Map(accounts.map((a) => [a.id, a.name] as const));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [accounts]);

  async function submit() {
    if (!from || !to) { toast.error("Selecione as contas de origem e destino"); return; }
    if (from === to) { toast.error("As contas devem ser diferentes"); return; }
    const amt = parseFloat(amount.replace(",", "."));
    if (!amt || amt <= 0) { toast.error("Informe um valor válido"); return; }
    try {
      await upsert.mutateAsync({
        type: "transfer",
        status: "confirmed",
        description: note.trim() || `Transferência ${accountName(from)} → ${accountName(to)}`,
        amount: amt,
        date,
        account_id: from,
        transfer_account_id: to,
      });
      toast.success("Transferência registrada");
      setAmount(""); setNote("");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao transferir");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transferências" description="Movimente valores entre suas contas." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary"><ArrowLeftRight className="h-4 w-4" /></div>
              <div className="text-base font-semibold">Nova transferência</div>
            </div>

            {accounts.length < 2 && (
              <div className="rounded-2xl bg-warning/10 p-3 text-sm text-warning">
                Cadastre pelo menos duas contas para transferir.
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Conta de origem</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} — {currency(Number(a.balance))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta de destino</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Selecionar conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== from).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valor</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="h-11 rounded-2xl" />
              </div>
              <div className="space-y-1.5"><Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-2xl" />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Observação</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Reserva mensal" className="h-11 rounded-2xl" />
            </div>
            <Button className="h-11 w-full rounded-2xl shadow-soft" onClick={submit} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar transferência
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="p-6">
            <div className="mb-4 text-base font-semibold">Histórico</div>
            {isLoading ? (
              <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma transferência registrada.</p>
            ) : (
              <div className="divide-y divide-border/70">
                {list.map((h) => (
                  <div key={h.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{accountName(h.account_id)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{accountName(h.transfer_account_id)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{currency(Number(h.amount))}</div>
                      <div className="text-[11px] text-muted-foreground">{shortDate(h.date)}</div>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => del.mutate(h.id)} aria-label="Excluir transferência"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
