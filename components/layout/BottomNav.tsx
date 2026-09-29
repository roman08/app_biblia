"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BookMarked, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Inicio", icon: Home, match: (p: string) => p === "/" },
  { href: "/leer", label: "Leer", icon: BookOpen, match: (p: string) => p === "/leer" },
  {
    href: "/planes",
    label: "Planes",
    icon: BookMarked,
    match: (p: string) => p.startsWith("/planes") || p.startsWith("/plan/"),
  },
  { href: "/notas", label: "Notas", icon: StickyNote, match: (p: string) => p.startsWith("/notas") },
];

// El lector tiene su propia barra inferior (navegación de capítulos);
// login y auth no llevan navegación.
function isHidden(pathname: string) {
  return (
    /^\/leer\/[^/]+\/[^/]+/.test(pathname) ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  );
}

export function BottomNav() {
  const pathname = usePathname();
  if (isHidden(pathname)) return null;

  return (
    <>
      {/* Espacio para que el contenido no quede debajo de la barra */}
      <div
        className="h-16 sm:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden="true"
      />
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegación principal"
      >
        <ul className="grid h-16 grid-cols-4">
          {ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
