import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Plus, Filter, Download, MoreHorizontal, Utensils, Car, ShoppingCart, Gamepad2, HeartPulse, GraduationCap, Home as HomeIcon, Briefcase, Laptop, TrendingUp, Wallet } from "lucide-react";
import { transactions, currency, shortDate, type TxType } from "@/lib/mock-data";
import type { ReactNode } from "react";

const iconMap: Record<string, any> = {
  utensils: Utensils, car: Car, "shopping-cart": ShoppingCart,
  "gamepad-2": Gamepad2, "heart-pulse": HeartPulse, "graduation-cap": GraduationCap,
  home: HomeIcon, briefcase: Briefcase, laptop: Laptop, "trending-up": TrendingUp,
};

export function TransactionsPage({
  title, description, kind, cta, badge,
}: { title: string; description: string; kind: TxType; cta: string; badge?: ReactNode }) {
  const list = transactions.filter((t) => t.type === kind);
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" className="rounded-2xl"><Download className="h-4 w-4" /> Exportar</Button>
            <Button className="rounded-2xl shadow-soft"><Plus className="h-4 w-4" /> {cta}</Button>
          </>
        }
      />

      {badge}

      <Card className="rounded-3xl border-border/70 shadow-soft">
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Pesquisar…" className="h-10 rounded-2xl pl-9" />
            </div>
            <Select><SelectTrigger className="h-10 min-w-[160px] rounded-2xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="alim">Alimentação</SelectItem><SelectItem value="tra">Transporte</SelectItem>
                <SelectItem value="lz">Lazer</SelectItem><SelectItem value="mer">Mercado</SelectItem>
              </SelectContent></Select>
            <Select><SelectTrigger className="h-10 min-w-[160px] rounded-2xl"><SelectValue placeholder="Conta" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as contas</SelectItem><SelectItem value="nub">Nubank</SelectItem><SelectItem value="ita">Itaú</SelectItem></SelectContent></Select>
            <Button variant="outline" className="h-10 rounded-2xl"><Filter className="h-4 w-4" /> Mais filtros</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => {
                  const Icon = iconMap[t.categoryIcon] ?? Wallet;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white" style={{ background: t.categoryColor }}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{t.description}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="rounded-full">{t.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{t.account}</TableCell>
                      <TableCell className="text-muted-foreground">{shortDate(t.date)}</TableCell>
                      <TableCell>
                        {t.status === "confirmed"
                          ? <Badge className="rounded-full bg-success/12 text-success hover:bg-success/12">Confirmada</Badge>
                          : <Badge className="rounded-full bg-warning/15 text-warning hover:bg-warning/15">Pendente</Badge>}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${kind === "income" ? "text-success" : "text-foreground"}`}>
                        {kind === "income" ? "+" : "−"} {currency(t.amount)}
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-xs text-muted-foreground">Mostrando {list.length} de {list.length} resultados</div>
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
