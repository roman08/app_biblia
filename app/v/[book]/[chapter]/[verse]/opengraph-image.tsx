import { DEFAULT_VERSION, getBook, getChapter, versionLabel } from "@/lib/bible-api";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/og-card";
import { truncate } from "@/lib/site";

export const alt = "Versículo de la Biblia Reina-Valera";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Imagen del enlace que se comparte desde el lector ("Compartir", "Copiar link")
export default async function Image({
  params,
}: {
  params: Promise<{ book: string; chapter: string; verse: string }>;
}) {
  const { book: slug, chapter, verse } = await params;
  const book = getBook(slug);
  const verseNumber = Number(verse);

  let text: string | undefined;
  let version: string | undefined;
  if (book) {
    try {
      const data = await getChapter(DEFAULT_VERSION, slug, Number(chapter));
      text = data.verses.find((v) => v.verse === verseNumber)?.text;
      version = data.version;
    } catch {
      // Midvash caído: se muestra la tarjeta sin el texto
    }
  }

  const reference = book ? `${book.name} ${chapter}:${verse}` : "Versículo";

  return renderOgCard({
    eyebrow: reference,
    quote: text ? truncate(text, 420) : undefined,
    title: text ? undefined : reference,
    // La versión que devolvió la API, no la que pedimos
    footer: version ? versionLabel(version).name : undefined,
  });
}
