import { supabase } from "@/integrations/supabase/client";

export const ACCESS_RESTRICTED_MESSAGE = "Este app está em acesso restrito no momento.";

/**
 * Verifica no backend (função security definer + RLS) se o usuário autenticado
 * pode usar o app. Quando não pode, encerra a sessão imediatamente.
 * Para liberar o acesso a todos, basta definir app_settings.access_restricted = false.
 */
export async function ensureAccessAllowed(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_access_allowed");
  if (error) {
    await supabase.auth.signOut();
    return false;
  }
  if (data !== true) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}
