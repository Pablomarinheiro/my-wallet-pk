import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/markdown";
import { generateFinanceInsights } from "@/lib/ai.functions";

export function AiInsightsCard() {
  const run = useServerFn(generateFinanceInsights);
  const insights = useMutation({ mutationFn: () => run({ data: undefined }) });

  useEffect(() => {
    insights.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          Insights da IA
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => insights.mutate()}
          disabled={insights.isPending}
        >
          {insights.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {insights.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        )}
        {insights.isError && (
          <p className="text-sm text-muted-foreground">
            Não foi possível gerar os insights agora. Tente novamente em instantes.
          </p>
        )}
        {!insights.isPending && insights.data?.text ? (
          <Markdown>{insights.data.text}</Markdown>
        ) : null}
        {!insights.isPending && insights.data && !insights.data.text ? (
          <p className="text-sm text-muted-foreground">
            Registre algumas transações para receber insights personalizados.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
