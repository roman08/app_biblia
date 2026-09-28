import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PushNotificationToggle } from "@/components/profile/PushNotificationToggle";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
          <CardDescription>Datos asociados a tu sesión</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ID de usuario</p>
            <p className="font-mono text-xs">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Proveedor</p>
            <p className="font-medium capitalize">
              {user.app_metadata.provider ?? "email"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Miembro desde</p>
            <p className="font-medium">
              {new Date(user.created_at).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
      <PushNotificationToggle />

    </div>
  );
}