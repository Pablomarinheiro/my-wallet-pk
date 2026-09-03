import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor, Globe, Bell, DatabaseBackup } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — My Wallet" },
      { name: "description", content: "Personalize aparência, idioma e notificações do My Wallet." },
    ],
  }),
  component: ConfigPage,
});

type Theme = "light" | "dark" | "system";
const PREF_KEY = "mywallet:prefs";

type Prefs = {
  theme: Theme;
  language: string;
  currency: string;
  dateFormat: string;
  weekly: boolean;
  dueAlerts: boolean;
  budgetAlerts: boolean;
  news: boolean;
};

const DEFAULTS: Prefs = {
  theme: "system", language: "pt", currency: "brl", dateFormat: "dmy",
  weekly: true, dueAlerts: true, budgetAlerts: true, news: false,
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const dark = theme === "dark"
    || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

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
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) return; // nunca muda o tema sozinho ao abrir Configurações
      const next = { ...DEFAULTS, ...JSON.parse(raw) };
      setPrefs(next);
      applyTheme(next.theme);
    } catch { /* mantém o tema atual */ }
  }, []);


  function update<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (key === "theme") applyTheme(value as Theme);
      return next;
    });
  }

  const themes: { value: Theme; icon: any; label: string }[] = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Escuro" },
    { value: "system", icon: Monitor, label: "Sistema" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Personalize a aparência, idioma e notificações da sua conta." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section icon={Sun} title="Aparência">
          <div>
            <Label className="mb-2 block">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => update("theme", t.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs transition-colors ${
                    prefs.theme === t.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section icon={Globe} title="Idioma e região">
          <Row label="Idioma">
            <Select value={prefs.language} onValueChange={(v) => update("language", v)}>
              <SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="pt">Português</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Moeda">
            <Select value={prefs.currency} onValueChange={(v) => update("currency", v)}>
              <SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="brl">BRL (R$)</SelectItem><SelectItem value="usd">USD ($)</SelectItem><SelectItem value="eur">EUR (€)</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row label="Formato de data">
            <Select value={prefs.dateFormat} onValueChange={(v) => update("dateFormat", v)}>
              <SelectTrigger className="w-40 rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="dmy">DD/MM/AAAA</SelectItem><SelectItem value="mdy">MM/DD/AAAA</SelectItem></SelectContent>
            </Select>
          </Row>
        </Section>

        <Section icon={Bell} title="Notificações">
          <Row label="Emails de resumo semanal" hint="Receba um panorama toda segunda">
            <Switch checked={prefs.weekly} onCheckedChange={(v) => update("weekly", v)} />
          </Row>
          <Row label="Alertas de vencimento" hint="3 dias antes do vencimento de faturas">
            <Switch checked={prefs.dueAlerts} onCheckedChange={(v) => update("dueAlerts", v)} />
          </Row>
          <Row label="Estouro de orçamento" hint="Aviso quando ultrapassar 80%">
            <Switch checked={prefs.budgetAlerts} onCheckedChange={(v) => update("budgetAlerts", v)} />
          </Row>
          <Row label="Novidades e dicas">
            <Switch checked={prefs.news} onCheckedChange={(v) => update("news", v)} />
          </Row>
        </Section>

        <Section icon={DatabaseBackup} title="Dados">
          <Row label="Exportar dados" hint="PDF, Excel ou CSV com filtros">
            <Button asChild variant="outline" className="rounded-2xl"><Link to="/relatorios">Abrir relatórios</Link></Button>
          </Row>
          <Row label="Importar CSV" hint="Traga o histórico de outro app ou do banco">
            <Button asChild variant="outline" className="rounded-2xl"><Link to="/relatorios">Importar</Link></Button>
          </Row>
        </Section>
      </div>
    </div>
  );
}
