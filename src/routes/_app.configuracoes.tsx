import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor, Globe, DollarSign, Bell, Shield, DatabaseBackup } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — My Wallet" }] }),
  component: ConfigPage,
});

function Section({ icon: Icon, title, children }: any) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-soft">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Row({ label, hint, children }: any) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Personalize a aparência, idioma e segurança da sua conta." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section icon={Sun} title="Aparência">
          <div>
            <Label className="mb-2 block">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {[{ icon: Sun, label: "Claro", active: true }, { icon: Moon, label: "Escuro" }, { icon: Monitor, label: "Sistema" }].map((t) => (
                <button key={t.label} className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs transition-colors ${t.active ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section icon={Globe} title="Idioma e região">
          <Row label="Idioma">
            <Select defaultValue="pt"><SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="pt">Português</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Moeda">
            <Select defaultValue="brl"><SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="brl">BRL (R$)</SelectItem><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Formato de data">
            <Select defaultValue="dmy"><SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="dmy">DD/MM/AAAA</SelectItem><SelectItem value="mdy">MM/DD/AAAA</SelectItem></SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={Bell} title="Notificações">
          <Row label="Emails de resumo semanal" hint="Receba um panorama toda segunda"><Switch defaultChecked /></Row>
          <Row label="Alertas de vencimento" hint="3 dias antes do vencimento de faturas"><Switch defaultChecked /></Row>
          <Row label="Estouro de orçamento" hint="Aviso quando ultrapassar 80%"><Switch defaultChecked /></Row>
          <Row label="Novidades e dicas"><Switch /></Row>
        </Section>

        <Section icon={Shield} title="Segurança">
          <Row label="Autenticação em 2 fatores" hint="Adicione uma camada extra"><Switch /></Row>
          <Row label="Sessões ativas" hint="Gerencie dispositivos conectados"><Button variant="outline" className="rounded-2xl">Ver</Button></Row>
          <Row label="Excluir conta" hint="Ação permanente"><Button variant="outline" className="rounded-2xl text-destructive hover:text-destructive">Excluir</Button></Row>
        </Section>

        <Section icon={DatabaseBackup} title="Backup e dados">
          <Row label="Backup automático" hint="Diariamente às 03:00"><Switch defaultChecked /></Row>
          <Row label="Exportar dados"><Button variant="outline" className="rounded-2xl">Baixar</Button></Row>
          <Row label="Importar OFX"><Button variant="outline" className="rounded-2xl">Enviar arquivo</Button></Row>
        </Section>

        <Section icon={DollarSign} title="Plano e cobrança">
          <Row label="Plano atual" hint="Free — até 3 contas"><Button className="rounded-2xl">Fazer upgrade</Button></Row>
        </Section>
      </div>
    </div>
  );
}
