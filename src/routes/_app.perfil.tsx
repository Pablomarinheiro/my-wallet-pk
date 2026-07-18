import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/_app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — My Wallet" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Atualize suas informações pessoais e credenciais." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="rounded-3xl border-border/70 shadow-soft">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">MW</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-soft" aria-label="Alterar foto"><Camera className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-4 text-lg font-semibold">Marina Weber</div>
            <div className="text-sm text-muted-foreground">marina@mywallet.app</div>
            <Button variant="outline" className="mt-4 rounded-2xl">Trocar foto</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader><CardTitle className="text-base">Informações pessoais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Nome</Label><Input defaultValue="Marina" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5"><Label>Sobrenome</Label><Input defaultValue="Weber" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Email</Label><Input type="email" defaultValue="marina@mywallet.app" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input defaultValue="(11) 99999-0000" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5"><Label>País</Label><Input defaultValue="Brasil" className="h-11 rounded-2xl" /></div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" className="rounded-2xl">Cancelar</Button>
                <Button className="rounded-2xl shadow-soft">Salvar alterações</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader><CardTitle className="text-base">Segurança da conta</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Senha atual</Label><Input type="password" placeholder="••••••••" className="h-11 rounded-2xl" /></div>
              <div /><div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" className="h-11 rounded-2xl" /></div>
              <div className="space-y-1.5"><Label>Confirmar senha</Label><Input type="password" className="h-11 rounded-2xl" /></div>
              <div className="md:col-span-2 flex justify-end"><Button className="rounded-2xl shadow-soft">Atualizar senha</Button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
