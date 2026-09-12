import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CreditCard, LineChart, Loader2, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Wallet — Gestão financeira pessoal" },
      {
        name: "description",
        content:
          "Fatura de cartão calculada pelas parcelas em aberto, orçamento que avisa antes de estourar e investimentos separados do seu saldo do dia a dia.",
      },
    ],
  }),
  component: LandingPage,
});

const BENEFITS = [
  {
    icon: CreditCard,
    title: "Fatura calculada, não digitada",
    description:
      "Parcele uma compra no cartão e a fatura de cada mês é somada automaticamente pelas parcelas em aberto — você nunca mais edita o valor na mão.",
  },
  {
    icon: Target,
    title: "Orçamento que avisa antes de estourar",
    description:
      "Defina um limite por categoria e receba um alerta em 80% e 100% do gasto, com o detalhe de cada lançamento que compõe o total.",
  },
  {
    icon: LineChart,
    title: "Investimentos fora do seu dia a dia",
    description:
      "O que está investido fica separado do saldo das contas — você sabe exatamente quanto pode gastar sem confundir com o que está aplicado.",
  },
] as const;

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  if (loading || user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight">My Wallet</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="rounded-2xl shadow-soft">
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </div>
      </header>

      <main>
        <section
          aria-label="Proposta"
          className="mx-auto max-w-3xl px-6 pb-16 pt-10 text-center sm:pt-16"
        >
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Fatura, orçamento e investimentos — calculados, não digitados.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            O My Wallet parcela suas compras no cartão, soma a fatura do mês sozinho e mantém o que
            você investe separado do que você pode gastar hoje.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-2xl shadow-soft">
              <Link to="/cadastro">
                Criar conta grátis <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        <section aria-label="Benefícios" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-tight">{b.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 My Wallet. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
