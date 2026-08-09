import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Nome vindo da conta autenticada (Google quando disponível) */
  displayName: string;
  /** Foto vinda da conta autenticada (Google quando disponível) */
  avatarUrl: string;
  /** true quando a sessão veio de um provedor social (Google) */
  isOAuthIdentity: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  displayName: "",
  avatarUrl: "",
  isOAuthIdentity: false,
  signOut: async () => {},
});

/** Extrai nome/foto exclusivamente da identidade do usuário autenticado. */
export function identityProfile(user: User | null) {
  if (!user) return { displayName: "", avatarUrl: "", isOAuthIdentity: false };

  const google = user.identities?.find((i) => i.provider === "google");
  const gData = (google?.identity_data ?? {}) as Record<string, unknown>;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = (gData[k] ?? meta[k]) as unknown;
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  return {
    displayName: pick("full_name", "name") || (user.email?.split("@")[0] ?? ""),
    avatarUrl: pick("avatar_url", "picture"),
    isOAuthIdentity: Boolean(google),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  // Ao trocar de usuário (ou sair), descarta qualquer dado em cache do usuário anterior.
  useEffect(() => {
    if (lastUserId.current === userId) return;
    const previous = lastUserId.current;
    lastUserId.current = userId;
    if (previous !== null) {
      queryClient.cancelQueries();
      queryClient.clear();
    }
  }, [userId, queryClient]);

  // Mantém a tabela profiles alinhada com a identidade autenticada (nunca com outro usuário).
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    let active = true;
    const { displayName, avatarUrl } = identityProfile(user);
    if (!displayName && !avatarUrl) return;

    (async () => {
      const { data: fresh } = await supabase.auth.getUser();
      // Confirma no servidor que a sessão ainda pertence a este usuário.
      if (!active || fresh.user?.id !== user.id) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active || (row && row.id !== user.id)) return;
      const needsSync =
        !row || (!!displayName && !row.full_name) || (!!avatarUrl && row.avatar_url !== avatarUrl);
      if (!needsSync) return;
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: row?.full_name || displayName,
        avatar_url: avatarUrl || row?.avatar_url || null,
      });
    })();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const identity = identityProfile(session?.user ?? null);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    ...identity,
    signOut: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
