"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <Badge className="w-fit">Dashboard Access</Badge>
          <CardTitle className="text-3xl font-semibold text-slate-900">
            Bienvenido al panel
          </CardTitle>
          <CardDescription>
            Usa tus credenciales de Firebase para entrar y administrar el portfolio. Todavía no conectamos el flujo real, así que esta pantalla es sólo el paso cero.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="studio@laurabutallo.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full gap-2">
            <LogIn className="size-4" />
            Ingresar al Dashboard
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Próximamente validaremos contra Firebase Auth. Mientras tanto, seguí construyendo el panel.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
