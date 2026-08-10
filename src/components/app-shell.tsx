import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Wallet, CreditCard, ArrowDownCircle, ArrowUpCircle,
  ArrowLeftRight, Tags, Target, PiggyBank, FileBarChart, User, Settings,
  Search, Bell, Menu, LogOut, ChevronRight, Plus, Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contas", label: "Contas", icon: Wallet },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/receitas", label: "Receitas", icon: ArrowUpCircle },
  { to: "/despesas", label: "Despesas", icon: ArrowDownCircle },
  { to: "/transferencias", label: "Transferências", icon: ArrowLeftRight },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/orcamento", label: "Orçamento", icon: PiggyBank },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/assistente", label: "Assistente IA", icon: Sparkles },
] as const;

const bottomNav = [
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function NewTransactionMenu({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className={cn("rounded-2xl shadow-soft", className)}>
          <Plus className="h-4 w-4" /> Nova transação
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-2xl">
        <DropdownMenuLabel>Escolha o tipo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/receitas" className="cursor-pointer gap-2">
            <ArrowUpCircle className="h-4 w-4 text-success" /> Receita
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/despesas" className="cursor-pointer gap-2">
            <ArrowDownCircle className="h-4 w-4 text-destructive" /> Despesa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/transferencias" className="cursor-pointer gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" /> Transferência
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Logo({ collapsed = false }: { collapsed?: boolean }) {

  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <Wallet className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight tracking-tight text-foreground">My Wallet</div>
          <div className="text-[11px] leading-tight text-muted-foreground">Finanças pessoais</div>
        </div>
      )}
    </Link>
  );
}

function NavItem({
  to, label, icon: Icon, active, collapsed,
}: { to: string; label: string; icon: any; active: boolean; collapsed: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
    </Link>
  );
}

function SidebarInner({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <Logo collapsed={collapsed} />
      </div>

      {!collapsed && <NewTransactionMenu className="w-full" />}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {!collapsed && <div className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</div>}
        {nav.map((item) => (
          <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} collapsed={collapsed} />
        ))}
        {!collapsed && <div className="mt-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Conta</div>}
        {bottomNav.map((item) => (
          <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} collapsed={collapsed} />
        ))}
      </nav>

    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const labels: Record<string, string> = {
    dashboard: "Dashboard", contas: "Contas", cartoes: "Cartões",
    receitas: "Receitas", despesas: "Despesas", transferencias: "Transferências",
    categorias: "Categorias", metas: "Metas", orcamento: "Orçamento",
    relatorios: "Relatórios", assistente: "Assistente IA", perfil: "Perfil", configuracoes: "Configurações",
  };
  return (
    <nav className="hidden items-center gap-1.5 text-sm md:flex">
      <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">My Wallet</Link>
      {segments.map((s, i) => (
        <span key={s} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className={cn("capitalize", i === segments.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")}>
            {labels[s] ?? s}
          </span>
        </span>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut, displayName: identityName } = useAuth();
  const navigate = useNavigate();
  const displayName = identityName || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-sidebar transition-all duration-300 lg:block",
          collapsed ? "w-[84px]" : "w-[268px]",
        )}
      >
        <SidebarInner collapsed={collapsed} pathname={pathname} />
      </aside>

      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-[84px]" : "lg:pl-[268px]")}>
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SidebarInner collapsed={false} pathname={pathname} />
                </SheetContent>
              </Sheet>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                aria-label="Recolher menu"
                onClick={() => setCollapsed((v) => !v)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Breadcrumbs pathname={pathname} />
            </div>

            <div className="mx-auto w-full max-w-md min-w-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar transações, contas, categorias…"
                  className="h-10 rounded-2xl border-border bg-secondary/60 pl-9 pr-3 focus-visible:bg-card"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="relative rounded-2xl" aria-label="Notificações">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-2xl px-2 py-1 transition-colors hover:bg-accent" aria-label="Menu do usuário">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <div className="text-[13px] font-semibold leading-tight text-foreground truncate max-w-[160px]">{displayName}</div>
                      <div className="text-[11px] leading-tight text-muted-foreground truncate max-w-[160px]">{user?.email}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/perfil"><User className="h-4 w-4" />Perfil</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/configuracoes"><Settings className="h-4 w-4" />Configurações</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>
                    <LogOut className="h-4 w-4" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title, description, actions, badge,
}: { title: string; description?: string; actions?: ReactNode; badge?: string }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        {badge && <Badge variant="secondary" className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">{badge}</Badge>}
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
