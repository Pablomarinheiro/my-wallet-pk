import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wallet, User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — My Wallet" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("A senha precisa ter no mínimo 8 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada! Você já pode acessar.");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Falha ao entrar com Google"); return; }
    if (!result.redirected) navigate({ to: "/dashboard", replace: true });
  }

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

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" required placeholder="Seu nome" className="h-11 rounded-2xl pl-9" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" required placeholder="voce@email.com" className="h-11 rounded-2xl pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" required placeholder="Mínimo 8 caracteres" className="h-11 rounded-2xl pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox defaultChecked className="mt-0.5" />
            <span>Concordo com os <a className="text-primary hover:underline" href="#">Termos</a> e <a className="text-primary hover:underline" href="#">Política de Privacidade</a>.</span>
          </label>

          <Button type="submit" disabled={loading} className="h-11 w-full rounded-2xl shadow-soft">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <Button type="button" variant="outline" className="h-11 w-full rounded-2xl" onClick={onGoogle}>
            Continuar com Google
          </Button>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            Já tem uma conta? <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
