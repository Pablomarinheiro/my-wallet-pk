import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CODE_TTL_MS = 10 * 60 * 1000;

const RequestLinkInput = z.object({
  // E.164: + seguido de 8 a 15 dígitos (ex: +5511999999999)
  phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/, "Informe o número no formato +55DDDNNNNNNNNN"),
});

/** Gera um código numérico de 6 dígitos ("000000".."999999") — nunca alfanumérico. */
function generateNumericCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

/**
 * Cria ou renova a associação de WhatsApp do usuário autenticado. Roda com o
 * client escopado por RLS (não service role) — a policy
 * whatsapp_auth_update_own_pending só deixa o dono da linha renovar enquanto
 * ela ainda estiver 'pending'; uma linha já 'confirmed' não pode ser
 * sobrescrita por aqui (precisa revogar antes, fluxo de Fase 2).
 */
export const requestWhatsappLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RequestLinkInput.parse(input))
  .handler(async ({ data, context }) => {
    const code = generateNumericCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

    const { error } = await context.supabase.from("whatsapp_authorizations").upsert(
      {
        user_id: context.userId,
        phone_number: data.phoneNumber,
        confirmation_code: code,
        confirmation_expires_at: expiresAt,
        authorization_status: "pending",
        failed_attempts: 0,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      // phone_number tem UNIQUE próprio — se já pertence a outra conta, o upsert
      // falha por violação de constraint em vez de roubar o número de outro usuário.
      if (error.code === "23505") {
        return { ok: false as const, error: "Esse número já está associado a outra conta." };
      }
      return { ok: false as const, error: "Não foi possível gerar o código. Tente novamente." };
    }

    return { ok: true as const, code, expiresAt };
  });

export const getWhatsappAuthorization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_authorizations")
      .select("phone_number, authorization_status, confirmation_expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) return { authorization: null };
    return { authorization: data };
  });
