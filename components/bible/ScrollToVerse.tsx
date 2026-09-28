"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollToVerse() {
  const pathname = usePathname();

  useEffect(() => {
    // Verificar si hay un hash en la URL (#v16)
    const hash = window.location.hash;
    if (!hash) return;

    // Extraer el número del versículo del hash (#v16 → 16)
    const verseMatch = hash.match(/^#v(\d+)$/);
    if (!verseMatch) return;

    const verseNumber = verseMatch[1];
    const elementId = `v${verseNumber}`;

    // Función para hacer scroll
    const scrollToVerse = () => {
      const element = document.getElementById(elementId);
      if (element) {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight temporal
          element.classList.add("ring-2", "ring-primary/50", "rounded");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary/50", "rounded");
          }, 2500);
        }, 100);
      }
    };

    // Ejecutar scroll
    scrollToVerse();

    // También escuchar cambios de hash (por si el usuario navega a otro versículo)
    const handleHashChange = () => {
      scrollToVerse();
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname]);

  return null;
}