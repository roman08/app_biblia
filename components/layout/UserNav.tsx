import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  StickyNote,
  BookMarked,
  BarChart3,
  Heart,
  Download,
} from "lucide-react";

export async function UserNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link href="/login">
        <Button size="sm">Iniciar sesión</Button>
      </Link>
    );
  }

  const initial = (user.email?.[0] ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {initial}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link
              href="/notas"
              className="flex items-center gap-2 cursor-pointer"
            >
              <StickyNote className="h-4 w-4" />
              Mis notas
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link
              href="/favoritos"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link
              href="/descargas"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Lectura sin conexión
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link
              href="/planes"
              className="flex items-center gap-2 cursor-pointer"
            >
              <BookMarked className="h-4 w-4" />
              Planes de lectura
            </Link>
          }
        />
        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link
              href="/estadisticas"
              className="flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </Link>
          }
        />

        <DropdownMenuSeparator />

        {/* Item: Mi perfil (usa render con <Link>) */}
        <DropdownMenuItem
          render={
            <Link
              href="/perfil"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Mi perfil
            </Link>
          }
        />

        <DropdownMenuSeparator />

        {/* Item: Cerrar sesión (form con server action) */}
        <form action={signOut} className="w-full">
          <DropdownMenuItem
            nativeButton
            render={
              <button
                type="submit"
                className="flex w-full items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            }
          />
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
