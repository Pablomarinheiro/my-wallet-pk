import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — My Wallet" },
      { name: "description", content: "Atualize seu nome, foto e senha da conta My Wallet." },
      { property: "og:title", content: "Perfil — My Wallet" },
      { property: "og:description", content: "Atualize seu nome, foto e senha da conta My Wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function initials(name: string, email: string) {
  const base = (name || email || "").trim();
  if (!base) return "?";
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function PerfilPage() {
  const { user, displayName: identityName, avatarUrl: identityAvatar, isOAuthIdentity } = useAuth();
  const email = user?.email ?? "";

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    // Sempre parte da identidade autenticada; nunca reaproveita estado de outro usuário.
    setFullName(identityName);
    setAvatarUrl(identityAvatar);
    setLoaded(false);
    if (!user) return;
    let active = true;
    const currentId = user.id;
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", currentId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        // Descarta qualquer linha que não pertença ao usuário logado.
        const row = data && data.id === currentId ? data : null;
        setFullName(row?.full_name || identityName);
        setAvatarUrl(isOAuthIdentity ? identityAvatar || row?.avatar_url || "" : row?.avatar_url || identityAvatar);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id, identityName, identityAvatar, isOAuthIdentity]);


  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    // Revalida a sessão no servidor antes de gravar (evita gravar no perfil de outro usuário).
    const { data: fresh } = await supabase.auth.getUser();
    if (fresh.user?.id !== user.id) {
      setSaving(false);
      return toast.error("Sessão expirada. Entre novamente.");
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: fresh.user.id, full_name: fullName, avatar_url: avatarUrl || null });
    if (!error) await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado");
  }


  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("A senha precisa ter no mínimo 8 caracteres");
    if (pwd !== pwd2) return toast.error("As senhas não coincidem");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    setPwd("");
    setPwd2("");
    toast.success("Senha atualizada");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Atualize suas informações pessoais e credenciais." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || email} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold uppercase">
                {initials(fullName, email)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 text-lg font-semibold">{fullName || "—"}</div>
            <div className="text-sm text-muted-foreground break-all">{email}</div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader><CardTitle className="text-base">Informações pessoais</CardTitle></CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={saveProfile}>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!loaded} className="h-11 rounded-2xl" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly disabled className="h-11 rounded-2xl" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="avatar">URL da foto</Label>
                  <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="h-11 rounded-2xl" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={saving || !loaded} className="rounded-2xl shadow-soft">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader><CardTitle className="text-base">Segurança da conta</CardTitle></CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={savePassword}>
                <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-11 rounded-2xl" /></div>
                <div className="space-y-1.5"><Label>Confirmar senha</Label><Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="h-11 rounded-2xl" /></div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={savingPwd} className="rounded-2xl shadow-soft">
                    {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
