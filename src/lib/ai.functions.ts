import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export const askFinanceAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data, context }) => {
    const { streamText } = await import("ai");
    const { createAiProvider, AI_MODEL, AI_PROVIDER_OPTIONS } = await import("./ai-gateway.server");
    const { buildFinanceContext, ASSISTANT_SYSTEM_PROMPT } = await import(
      "./finance-context.server"
    );

    const finance = await buildFinanceContext(context.supabase);
    const provider = createAiProvider();

    const result = streamText({
      model: provider.responses(AI_MODEL),
      system: `${ASSISTANT_SYSTEM_PROMPT}\n\n=== DADOS FINANCEIROS DO USUÁRIO ===\n${finance}`,
      messages: data.messages,
      providerOptions: AI_PROVIDER_OPTIONS as never,
    });

    const text = await result.text;
    return { text: text?.trim() || "Não consegui gerar uma resposta agora. Tente novamente." };
  });

export const generateFinanceInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { streamText } = await import("ai");
    const { createAiProvider, AI_MODEL, AI_PROVIDER_OPTIONS } = await import("./ai-gateway.server");
    const { buildFinanceContext, ASSISTANT_SYSTEM_PROMPT } = await import(
      "./finance-context.server"
    );

    const finance = await buildFinanceContext(context.supabase);
    const provider = createAiProvider();

    const result = streamText({
      model: provider.responses(AI_MODEL),
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: `Com base nos dados abaixo, escreva de 3 a 5 insights curtos sobre a saúde financeira do usuário.
Cada insight deve ser um item de lista em markdown, começando por um rótulo em negrito (ex: **Alerta:**, **Tendência:**, **Oportunidade:**), com no máximo 2 frases e sempre citando números reais.
Priorize: variações relevantes de gasto por categoria, risco de saldo negativo antes do fim do mês, progresso das metas e estouro de orçamento.
Não escreva introdução nem conclusão, apenas a lista.

=== DADOS FINANCEIROS ===
${finance}`,
      providerOptions: AI_PROVIDER_OPTIONS as never,
    });

    const text = await result.text;
    return { text: text?.trim() || "" };
  });
