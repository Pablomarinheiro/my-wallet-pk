import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_app/receitas")({
  head: () => ({ meta: [{ title: "Receitas — My Wallet" }] }),
  component: () => (
    <TransactionsPage
      title="Receitas"
      description="Todas as entradas de dinheiro nas suas contas."
      kind="income"
      cta="Nova receita"
    />
  ),
});
