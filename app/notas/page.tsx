import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllNotes } from "@/lib/supabase/notes-actions";
import { getBook } from "@/lib/bible-api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const COLOR_CLASSES: Record<string, string> = {
  yellow: "bg-yellow-300",
  green: "bg-green-300",
  blue: "bg-blue-300",
  pink: "bg-pink-300",
};

export default async function NotasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/notas");

  const notes = await getAllNotes();

  // Agrupar por libro+capítulo
  const grouped = notes.reduce<Record<string, typeof notes>>((acc, note) => {
    const key = `${note.book}-${note.chapter}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  return (
  <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
    <h1 className="text-2xl font-bold mb-1 sm:text-3xl">Mis notas</h1>
    <p className="text-sm text-muted-foreground mb-6">
      {notes.length} {notes.length === 1 ? "anotación" : "anotaciones"}
    </p>

    {notes.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no tienes notas ni resaltados.
          </p>
          <Link href="/leer">
            <Button>Empezar a leer</Button>
          </Link>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {Object.entries(grouped).map(([key, items]) => {
          const { book, chapter } = items[0];
          const bookData = getBook(book);
          return (
            <Card key={key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  <Link
                    href={`/leer/${book}/${chapter}`}
                    className="hover:underline"
                  >
                    {bookData?.name ?? book} {chapter}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((note) => (
                  <Link
                    key={note.id}
                    href={`/leer/${note.book}/${note.chapter}#v${note.verse}`}
                    className="flex gap-3 items-start rounded-md border p-3 hover:bg-accent active:bg-accent/80 transition-colors"
                  >
                    {note.color && (
                      <span
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full ${
                          COLOR_CLASSES[note.color] ?? "bg-muted"
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {note.verse && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Versículo {note.verse}
                        </p>
                      )}
                      {note.content && (
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">
                          {note.content}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
  </div>
);
}