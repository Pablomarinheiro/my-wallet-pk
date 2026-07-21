import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AccountRow = Tables<"accounts">;
export type CardRow = Tables<"cards">;
export type CategoryRow = Tables<"categories">;
export type TransactionRow = Tables<"transactions">;

type TableName = "accounts" | "cards" | "categories" | "transactions";

function useRealtime(table: TableName, userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`rt-${table}-${userId}`)
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
        .select("*, category:categories(id,name,icon,color), account:accounts(id,name,color)")
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", user?.id] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions", user?.id] }),
  });
}
