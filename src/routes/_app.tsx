import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ACCESS_RESTRICTED_MESSAGE, ensureAccessAllowed } from "@/lib/access";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppRoute,
});

function AppRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  // Trava temporária de acesso: validada no backend, não no frontend.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const allowed = await ensureAccessAllowed();
      if (!active || allowed) return;
      toast.error(ACCESS_RESTRICTED_MESSAGE);
      navigate({ to: "/login", replace: true });
    })();
    return () => { active = false; };
  }, [user?.id, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
