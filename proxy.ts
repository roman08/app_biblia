import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = ["/perfil", "/notas", "/favoritos", "/diario", "/oracion"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Verificar si la ruta está protegida
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // no-op aquí, ya lo maneja updateSession
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Las imágenes de Open Graph las piden WhatsApp, Facebook, etc.: no necesitan sesión
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};