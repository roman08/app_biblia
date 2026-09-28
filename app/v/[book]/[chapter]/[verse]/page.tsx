import { notFound } from "next/navigation";
import Link from "next/link";
import { getChapter, getBook } from "@/lib/bible-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{
    book: string;
    chapter: string;
    verse: string;
  }>;
}

export default async function VersePage({ params }: PageProps) {
  const { book: bookSlug, chapter: chapterStr, verse: verseStr } = await params;

  const book = getBook(bookSlug);
  if (!book) notFound();

  const chapter = parseInt(chapterStr, 10);
  const verse = parseInt(verseStr, 10);

  if (isNaN(chapter) || isNaN(verse)) notFound();

  const data = await getChapter("rvr1960", bookSlug, chapter);
  const verseData = data.verses.find((v) => v.verse === verse);
  if (!verseData) notFound();

  const reference = `${book.name} ${chapter}:${verse}`;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link href={`/leer/${bookSlug}/${chapter}#v${verse}`}>
        <Button variant="ghost" size="sm" className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Leer capítulo completo
        </Button>
      </Link>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="w-12 h-1 bg-primary" />

          <blockquote className="space-y-4">
            <p className="text-2xl leading-relaxed font-serif">
              "{verseData.text}"
            </p>
            <footer className="text-sm font-semibold text-primary">
              — {reference} (RVR1960)
            </footer>
          </blockquote>

          <div className="border-t pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Este versículo es parte de {book.name} capítulo {chapter}.
            </p>
            <Link href={`/leer/${bookSlug}/${chapter}#v${verse}`}>
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Ver en contexto
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { book: bookSlug, chapter, verse } = await params;
  const book = getBook(bookSlug);
  if (!book) return { title: "Versículo no encontrado" };

  const data = await getChapter("rvr1960", bookSlug, parseInt(chapter, 10));
  const verseData = data.verses.find((v) => v.verse === parseInt(verse, 10));

  const reference = `${book.name} ${chapter}:${verse}`;
  const preview = verseData?.text
    ? verseData.text.slice(0, 100) + (verseData.text.length > 100 ? "..." : "")
    : "";

  return {
    title: `${reference} · Biblia App`,
    description: preview,
    openGraph: {
      title: reference,
      description: preview,
      type: "article",
    },
  };
}