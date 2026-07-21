import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useDeleteCategory, useUpsertCategory, type CategoryRow } from "@/hooks/use-mywallet";
import { COLOR_OPTIONS, ICON_OPTIONS, getIcon } from "@/lib/icons";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/categorias")({
  head: () => ({ meta: [{ title: "Categorias — My Wallet" }] }),
  component: CategoriasPage,
});

function CategoryDialog({ category, defaultType, trigger }: { category?: CategoryRow; defaultType?: "income" | "expense"; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<string>(category?.type ?? defaultType ?? "expense");
  const [icon, setIcon] = useState(category?.icon ?? "tag");
  const [color, setColor] = useState(category?.color ?? COLOR_OPTIONS[0]);
  const upsert = useUpsertCategory();

  async function save() {
    if (!name.trim()) { toast.error("Informe um nome"); return; }
    try {
      await upsert.mutateAsync({ id: category?.id, name: name.trim(), type: type as CategoryRow["type"], icon, color });
      toast.success(category ? "Categoria atualizada" : "Categoria criada");
      setOpen(false);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl" /></div>
          <div className="space-y-1.5"><Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((key) => {
                const I = getIcon(key);
                return (
                  <button key={key} type="button" onClick={() => setIcon(key)} className={`grid h-9 w-9 place-items-center rounded-xl border-2 ${icon === key ? "border-primary bg-primary/10" : "border-transparent bg-secondary"}`} aria-label={key}>
                    <I className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5"><Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button className="rounded-2xl" onClick={save} disabled={upsert.isPending}>
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriasPage() {
  const { data: categories = [], isLoading } = useCategories();
  const del = useDeleteCategory();

  const render = (type: "income" | "expense") => {
    const list = categories.filter((c) => c.type === type);
    if (isLoading) return <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    if (list.length === 0) return (
      <Card className="rounded-3xl border-dashed"><CardContent className="p-10 text-center">
        <Tag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <div className="font-semibold">Sem categorias</div>
        <p className="mt-1 text-sm text-muted-foreground">Crie categorias para organizar suas transações.</p>
        <div className="mt-4"><CategoryDialog defaultType={type} trigger={<Button className="rounded-2xl"><Plus className="h-4 w-4" /> Nova categoria</Button>} /></div>
      </CardContent></Card>
    );
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {list.map((c) => {
          const Icon = getIcon(c.icon);
          return (
            <Card key={c.id} className="rounded-3xl border-border/70 shadow-soft transition-shadow hover:shadow-elevated">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: c.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <CategoryDialog category={c} trigger={<Button size="icon" variant="ghost" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>} />
                    <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => { if (confirm(`Excluir categoria "${c.name}"?`)) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground">{c.name}</div>
                <Badge variant="secondary" className="mt-1.5 rounded-full text-[10px]">{type === "income" ? "Receita" : "Despesa"}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize suas transações com categorias personalizadas."
        actions={<CategoryDialog trigger={<Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> Nova categoria</Button>} />}
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
