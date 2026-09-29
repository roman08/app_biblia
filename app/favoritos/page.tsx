import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllFavorites } from "@/lib/supabase/favorites-actions";
import { getBook, getPassages } from "@/lib/bible-api";
import { Button } from "@/components/ui/button";
import { FavoriteCard } from "@/components/favorites/FavoriteCard";

export const metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/favoritos");

  const favorites = await getAllFavorites();
  // Una sola llamada a Midvash por cada 50 favoritos
  const texts = await getPassages(favorites);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {favorites.length === 0
            ? "Los versículos que guardes aparecerán aquí"
            : `${favorites.length} ${favorites.length === 1 ? "versículo guardado" : "versículos guardados"}`}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <p className="font-semibold">Aún no tienes favoritos</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            En el lector, toca un versículo y elige &quot;Agregar a favoritos&quot;.
          </p>
          <Link href="/leer" className="mt-4 inline-block">
            <Button>Ir a leer</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((f, i) => (
            <FavoriteCard
              key={f.id}
              book={f.book}
              bookName={getBook(f.book)?.name ?? f.book}
              chapter={f.chapter}
              verse={f.verse}
              text={texts[i]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
