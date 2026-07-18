import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/transactions-page";

export const Route = createFileRoute("/_app/despesas")({
  head: () => ({ meta: [{ title: "Despesas — My Wallet" }] }),
  component: () => (
    <TransactionsPage
      title="Despesas"
      description="Todas as saídas registradas nas suas contas e cartões."
      kind="expense"
      cta="Nova despesa"
    />
  ),
});
