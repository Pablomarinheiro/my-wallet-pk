import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, MoreHorizontal, Utensils, Car, ShoppingCart, Gamepad2, HeartPulse, GraduationCap, Home as HomeIcon, Briefcase, Laptop, TrendingUp, Wallet } from "lucide-react";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/categorias")({
  head: () => ({ meta: [{ title: "Categorias — My Wallet" }] }),
  component: CategoriasPage,
});

const iconMap: Record<string, any> = {
  utensils: Utensils, car: Car, "shopping-cart": ShoppingCart,
  "gamepad-2": Gamepad2, "heart-pulse": HeartPulse, "graduation-cap": GraduationCap,
  home: HomeIcon, briefcase: Briefcase, laptop: Laptop, "trending-up": TrendingUp,
};

function CategoriasPage() {
  const render = (type: "income" | "expense") => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {categories.filter((c) => c.type === type).map((c) => {
        const Icon = iconMap[c.icon] ?? Wallet;
        return (
          <Card key={c.id} className="rounded-3xl border-border/70 shadow-soft transition-shadow hover:shadow-elevated">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: c.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <Button size="icon" variant="ghost" aria-label="Opções"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <div className="mt-3 text-sm font-semibold text-foreground">{c.name}</div>
              <Badge variant="secondary" className="mt-1.5 rounded-full text-[10px]">{type === "income" ? "Receita" : "Despesa"}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize suas transações com categorias personalizadas."
        actions={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova categoria</Button>}
      />
      <Tabs defaultValue="expense">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="expense" className="rounded-xl">Despesas</TabsTrigger>
          <TabsTrigger value="income" className="rounded-xl">Receitas</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">{render("expense")}</TabsContent>
        <TabsContent value="income" className="mt-4">{render("income")}</TabsContent>
      </Tabs>
    </div>
  );
}
