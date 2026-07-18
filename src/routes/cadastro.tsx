import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, User, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — My Wallet" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated md:p-10">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">My Wallet</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Crie sua conta grátis</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Comece a controlar suas finanças em menos de 2 minutos.</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => { e.preventDefault(); navigate({ to: "/dashboard" }); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" placeholder="Marina Weber" className="h-11 rounded-2xl pl-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="voce@email.com" className="h-11 rounded-2xl pl-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="h-11 rounded-2xl pl-9" />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox defaultChecked className="mt-0.5" />
            <span>Concordo com os <a className="text-primary hover:underline" href="#">Termos</a> e <a className="text-primary hover:underline" href="#">Política de Privacidade</a>.</span>
          </label>

          <Button type="submit" className="h-11 w-full rounded-2xl shadow-soft">
            Criar conta <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            Já tem uma conta? <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
