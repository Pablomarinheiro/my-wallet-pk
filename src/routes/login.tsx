import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — My Wallet" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-[oklch(0.42_0.22_262)] p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">My Wallet</span>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Suas finanças, com clareza
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Controle total do seu dinheiro em um único painel.
          </h2>
          <p className="mt-4 text-sm text-white/80">
            Contas, cartões, metas e orçamentos. Uma experiência minimalista e premium para você tomar decisões melhores todo mês.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { k: "R$ 45k", v: "Economia média" },
              { k: "12+", v: "Bancos suportados" },
              { k: "4.9", v: "Avaliação App Store" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <div className="text-lg font-bold">{s.k}</div>
                <div className="text-[11px] text-white/70">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/60">© 2026 My Wallet. Todos os direitos reservados.</div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-10 md:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">My Wallet</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Bem-vindo de volta</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Acesse sua conta para continuar organizando suas finanças.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="voce@email.com" className="h-11 rounded-2xl pl-9" defaultValue="marina@mywallet.app" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/login" className="text-xs font-medium text-primary hover:underline">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={show ? "text" : "password"} placeholder="••••••••" className="h-11 rounded-2xl px-9" defaultValue="senha123" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox defaultChecked /> Manter conectado por 30 dias
            </label>

            <Button type="submit" className="h-11 w-full rounded-2xl shadow-soft">
              Entrar <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="relative py-2"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">ou</span></div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-11 rounded-2xl">Google</Button>
              <Button type="button" variant="outline" className="h-11 rounded-2xl">Apple</Button>
            </div>

            <p className="pt-2 text-center text-sm text-muted-foreground">
              Não tem conta? <Link to="/cadastro" className="font-semibold text-primary hover:underline">Criar conta</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
