import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

/**
 * Builds a compact, text-only snapshot of the authenticated user's finances.
 * RLS scopes every query to the caller.
 */
export async function buildFinanceContext(supabase: Client) {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  const sinceIso = since.toISOString().slice(0, 10);

  const [accounts, cards, categories, transactions, goals, budgets] = await Promise.all([
    supabase.from("accounts").select("id,name,type,balance,bank"),
    supabase.from("cards").select("name,brand,limit,used,closing_day,due_day"),
    supabase.from("categories").select("id,name,type"),
    supabase
      .from("transactions")
      .select("date,description,amount,type,status,category_id,account_id")
      .gte("date", sinceIso)
      .order("date", { ascending: false })
      .limit(600),
    supabase.from("goals").select("name,target,current,deadline"),
    supabase.from("budgets").select("category_name,amount_limit,month,year"),
  ]);

  const catById = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const accById = new Map((accounts.data ?? []).map((a) => [a.id, a.name]));
  const txs = transactions.data ?? [];

  const totalBalance = (accounts.data ?? []).reduce((s, a) => s + Number(a.balance ?? 0), 0);

  // Monthly aggregation
  const byMonth = new Map<string, { income: number; expense: number }>();
  const byCategory = new Map<string, number>();
  for (const t of txs) {
    const month = String(t.date).slice(0, 7);
    const entry = byMonth.get(month) ?? { income: 0, expense: 0 };
    const value = Number(t.amount ?? 0);
    if (t.type === "income") entry.income += value;
    if (t.type === "expense") {
      entry.expense += value;
      const key = catById.get(t.category_id ?? "") ?? "Sem categoria";
      byCategory.set(key, (byCategory.get(key) ?? 0) + value);
    }
    byMonth.set(month, entry);
  }

  const lines: string[] = [];
  lines.push(`Data de hoje: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Saldo total das contas: ${brl(totalBalance)}`);

  lines.push("\nCONTAS:");
  for (const a of accounts.data ?? [])
    lines.push(`- ${a.name} (${a.type}): ${brl(Number(a.balance ?? 0))}`);

  if ((cards.data ?? []).length) {
    lines.push("\nCARTÕES:");
    for (const c of cards.data ?? [])
      lines.push(
        `- ${c.name} (${c.brand ?? "-"}): fatura ${brl(Number(c.used ?? 0))} de limite ${brl(Number(c.limit ?? 0))}, fecha dia ${c.closing_day ?? "-"}, vence dia ${c.due_day ?? "-"}`,
      );
  }

  lines.push("\nRESUMO MENSAL (últimos 6 meses):");
  for (const [month, v] of [...byMonth.entries()].sort().reverse())
    lines.push(
      `- ${month}: receitas ${brl(v.income)} | despesas ${brl(v.expense)} | saldo ${brl(v.income - v.expense)}`,
    );

  lines.push("\nDESPESAS POR CATEGORIA (6 meses):");
  for (const [name, total] of [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15))
    lines.push(`- ${name}: ${brl(total)}`);

  if ((goals.data ?? []).length) {
    lines.push("\nMETAS:");
    for (const g of goals.data ?? [])
      lines.push(
        `- ${g.name}: ${brl(Number(g.current ?? 0))} de ${brl(Number(g.target ?? 0))}${g.deadline ? ` (prazo ${g.deadline})` : ""}`,
      );
  }

  if ((budgets.data ?? []).length) {
    lines.push("\nORÇAMENTOS:");
    for (const b of budgets.data ?? [])
      lines.push(
        `- ${b.category_name ?? "Geral"} ${String(b.month).padStart(2, "0")}/${b.year}: ${brl(Number(b.amount_limit ?? 0))}`,
      );
  }

  lines.push("\nÚLTIMAS TRANSAÇÕES (até 40):");
  for (const t of txs.slice(0, 40))
    lines.push(
      `- ${t.date} | ${t.type} | ${brl(Number(t.amount ?? 0))} | ${t.description ?? "-"} | ${catById.get(t.category_id ?? "") ?? "Sem categoria"} | ${accById.get(t.account_id ?? "") ?? "-"} | ${t.status ?? "-"}`,
    );

  return lines.join("\n");
}

export const ASSISTANT_SYSTEM_PROMPT = `Você é o assistente financeiro do My Wallet, um app de finanças pessoais brasileiro.
Responda sempre em português do Brasil, de forma direta, prática e amigável.
Use exclusivamente os dados financeiros reais fornecidos no contexto — nunca invente valores.
Formate valores em Real (R$). Use markdown curto (listas e negrito) e no máximo ~200 palavras por resposta.
Quando não houver dados suficientes, diga isso e sugira o que o usuário pode registrar no app.`;
