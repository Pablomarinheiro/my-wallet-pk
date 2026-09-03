import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AccountRow = Tables<"accounts">;
export type CardRow = Tables<"cards">;
export type CategoryRow = Tables<"categories">;
export type TransactionRow = Tables<"transactions">;
export type GoalRow = Tables<"goals">;
export type BudgetRow = Tables<"budgets">;

type TableName =
  | "accounts" | "cards" | "categories" | "transactions" | "goals" | "budgets"
  | "card_purchases" | "card_installments" | "investments" | "investment_transactions";

function useRealtime(table: TableName, userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`rt-${table}-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: [table, userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId, qc]);
}

// ---------- ACCOUNTS ----------
export function useAccounts() {
  const { user } = useAuth();
  useRealtime("accounts", user?.id);
  return useQuery({
    queryKey: ["accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as AccountRow[];
    },
  });
}
export function useUpsertAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AccountRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"accounts">;
      const { error } = input.id
        ? await supabase.from("accounts").update(row as TablesUpdate<"accounts">).eq("id", input.id)
        : await supabase.from("accounts").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", user?.id] }),
  });
}
export function useDeleteAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts", user?.id] }),
  });
}

// ---------- CARDS ----------
export function useCards() {
  const { user } = useAuth();
  useRealtime("cards", user?.id);
  return useQuery({
    queryKey: ["cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("cards").select("*").order("created_at");
      if (error) throw error;
      return data as CardRow[];
    },
  });
}
export function useUpsertCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CardRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"cards">;
      const { error } = input.id
        ? await supabase.from("cards").update(row as TablesUpdate<"cards">).eq("id", input.id)
        : await supabase.from("cards").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", user?.id] }),
  });
}
export function useDeleteCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", user?.id] }),
  });
}

// ---------- CATEGORIES ----------
export function useCategories() {
  const { user } = useAuth();
  useRealtime("categories", user?.id);
  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });
}
export function useUpsertCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CategoryRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"categories">;
      const { error } = input.id
        ? await supabase.from("categories").update(row as TablesUpdate<"categories">).eq("id", input.id)
        : await supabase.from("categories").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", user?.id] }),
  });
}
export function useDeleteCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories", user?.id] }),
  });
}

// ---------- TRANSACTIONS ----------
export type TransactionWithRelations = TransactionRow & {
  category: Pick<CategoryRow, "id" | "name" | "icon" | "color"> | null;
  account: Pick<AccountRow, "id" | "name" | "color"> | null;
};
export function useTransactions(kind?: "income" | "expense" | "transfer") {
  const { user } = useAuth();
  useRealtime("transactions", user?.id);
  return useQuery({
    queryKey: ["transactions", user?.id, kind ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select(
          "*, category:categories(id,name,icon,color), account:accounts!transactions_account_id_fkey(id,name,color)",
        )
        .order("date", { ascending: false });
      if (kind) q = q.eq("type", kind);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TransactionWithRelations[];
    },
  });
}
export function useUpsertTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TransactionRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"transactions">;
      const { error } = input.id
        ? await supabase.from("transactions").update(row as TablesUpdate<"transactions">).eq("id", input.id)
        : await supabase.from("transactions").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", user?.id] });
      qc.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });
}
export function useDeleteTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", user?.id] });
      qc.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });
}


// ---------- GOALS ----------
export function useGoals() {
  const { user } = useAuth();
  useRealtime("goals", user?.id);
  return useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at");
      if (error) throw error;
      return data as GoalRow[];
    },
  });
}
export function useUpsertGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<GoalRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"goals">;
      const { error } = input.id
        ? await supabase.from("goals").update(row as TablesUpdate<"goals">).eq("id", input.id)
        : await supabase.from("goals").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
  });
}
export function useDeleteGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", user?.id] }),
  });
}

// ---------- BUDGETS ----------
export function useBudgets() {
  const { user } = useAuth();
  useRealtime("budgets", user?.id);
  return useQuery({
    queryKey: ["budgets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*").order("created_at");
      if (error) throw error;
      return data as BudgetRow[];
    },
  });
}
export function useUpsertBudget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BudgetRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"budgets">;
      const { error } = input.id
        ? await supabase.from("budgets").update(row as TablesUpdate<"budgets">).eq("id", input.id)
        : await supabase.from("budgets").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets", user?.id] }),
  });
}
export function useDeleteBudget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets", user?.id] }),
  });
}

// ---------- CARD PURCHASES / INSTALLMENTS ----------
export type CardPurchaseRow = Tables<"card_purchases">;
export type CardInstallmentRow = Tables<"card_installments">;

export function useCardPurchases(cardId?: string) {
  const { user } = useAuth();
  useRealtime("card_purchases", user?.id);
  return useQuery({
    queryKey: ["card_purchases", user?.id, cardId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("card_purchases")
        .select("*, categories(id, name, color), card_installments(*)")
        .order("purchase_date", { ascending: false });
      if (cardId) q = q.eq("card_id", cardId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as (CardPurchaseRow & {
        categories: { id: string; name: string; color: string } | null;
        card_installments: CardInstallmentRow[];
      })[];
    },
  });
}

export function useCardInstallments() {
  const { user } = useAuth();
  useRealtime("card_installments", user?.id);
  return useQuery({
    queryKey: ["card_installments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("card_installments").select("*").order("due_date");
      if (error) throw error;
      return (data ?? []) as CardInstallmentRow[];
    },
  });
}

export function useUpsertCardPurchase() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CardPurchaseRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"card_purchases">;
      const { error } = input.id
        ? await supabase.from("card_purchases").update(row as TablesUpdate<"card_purchases">).eq("id", input.id)
        : await supabase.from("card_purchases").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card_purchases", user?.id] });
      qc.invalidateQueries({ queryKey: ["card_installments", user?.id] });
    },
  });
}

export function useDeleteCardPurchase() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("card_purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card_purchases", user?.id] });
      qc.invalidateQueries({ queryKey: ["card_installments", user?.id] });
    },
  });
}

// ---------- INVESTMENTS ----------
export type InvestmentRow = Tables<"investments">;
export type InvestmentTxRow = Tables<"investment_transactions">;

export function useInvestments() {
  const { user } = useAuth();
  useRealtime("investments", user?.id);
  return useQuery({
    queryKey: ["investments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("investments").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as InvestmentRow[];
    },
  });
}

export function useInvestmentTransactions(investmentId?: string) {
  const { user } = useAuth();
  useRealtime("investment_transactions", user?.id);
  return useQuery({
    queryKey: ["investment_transactions", user?.id, investmentId ?? "all"],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("investment_transactions").select("*").order("date", { ascending: false });
      if (investmentId) q = q.eq("investment_id", investmentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InvestmentTxRow[];
    },
  });
}

export function useUpsertInvestment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<InvestmentRow> & { id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const row = { ...input, user_id: user.id } as TablesInsert<"investments">;
      const { error } = input.id
        ? await supabase.from("investments").update(row as TablesUpdate<"investments">).eq("id", input.id)
        : await supabase.from("investments").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments", user?.id] }),
  });
}

export function useDeleteInvestment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments", user?.id] }),
  });
}

/** Registra aporte/resgate e atualiza o valor atual do ativo. */
export function useAddInvestmentTx() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      investment_id: string; kind: "deposit" | "withdraw"; amount: number; quantity?: number; date: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("investment_transactions").insert({
        ...input, user_id: user.id, quantity: input.quantity ?? 0,
      } as TablesInsert<"investment_transactions">);
      if (error) throw error;

      const { data: inv } = await supabase
        .from("investments").select("quantity, avg_price, current_value").eq("id", input.investment_id).single();
      if (inv) {
        const sign = input.kind === "deposit" ? 1 : -1;
        const qty = Number(inv.quantity) + sign * (input.quantity ?? 0);
        const invested = Number(inv.avg_price) * Number(inv.quantity) + sign * input.amount;
        await supabase.from("investments").update({
          quantity: Math.max(qty, 0),
          avg_price: qty > 0 ? Math.max(invested, 0) / qty : 0,
          current_value: Math.max(Number(inv.current_value) + sign * input.amount, 0),
        }).eq("id", input.investment_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments", user?.id] });
      qc.invalidateQueries({ queryKey: ["investment_transactions", user?.id] });
    },
  });
}

/** Total investido (custo) e valor atual do portfólio. */
export function usePortfolioTotals() {
  const { data: investments = [] } = useInvestments();
  const invested = investments.reduce((s, i) => s + Number(i.avg_price) * Number(i.quantity), 0);
  const current = investments.reduce((s, i) => s + Number(i.current_value), 0);
  return { invested, current, profit: current - invested, percent: invested > 0 ? ((current - invested) / invested) * 100 : 0 };
}
