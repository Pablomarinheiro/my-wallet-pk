import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { askFinanceAssistant } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistente")({
  ssr: false,
  component: AssistantPage,
  head: () => ({
    meta: [
      { title: "Assistente IA | My Wallet" },
      {
        name: "description",
        content:
          "Converse com o assistente financeiro do My Wallet e receba análises dos seus gastos, metas e orçamento com base em dados reais.",
      },
      { property: "og:title", content: "Assistente IA | My Wallet" },
      {
        property: "og:description",
        content: "Análises e respostas sobre suas finanças pessoais com inteligência artificial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como estão meus gastos este mês?",
  "Onde posso economizar?",
  "Vou conseguir bater minhas metas?",
  "Meu orçamento está estourando em alguma categoria?",
];

function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askFinanceAssistant);

  const chat = useMutation({
    mutationFn: (next: ChatMessage[]) => ask({ data: { messages: next } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.text }]),
    onError: () => toast.error("Não consegui responder agora. Tente novamente."),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || chat.isPending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setInput("");
    chat.mutate(next);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          Assistente IA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pergunte qualquer coisa sobre suas finanças. As respostas usam seus dados reais.
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-2xl shadow-soft">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Comece com uma das sugestões abaixo ou escreva sua própria pergunta.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end gap-2" : "flex justify-start gap-2"}
            >
              {m.role === "assistant" && (
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-soft"
                    : "max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-foreground"
                }
              >
                {m.role === "user" ? m.content : <Markdown>{m.content}</Markdown>}
              </div>
              {m.role === "user" && (
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}

          {chat.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando suas finanças...
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre seus gastos, metas ou orçamento..."
            className="rounded-xl"
            disabled={chat.isPending}
          />
          <Button type="submit" className="rounded-xl" disabled={chat.isPending || !input.trim()}>
            {chat.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
