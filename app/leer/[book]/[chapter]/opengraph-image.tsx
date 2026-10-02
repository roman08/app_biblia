import { DEFAULT_VERSION, getBook, getChapter, versionLabel } from "@/lib/bible-api";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/og-card";
import { truncate } from "@/lib/site";

export const alt = "Capítulo de la Biblia Reina-Valera";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book: slug, chapter } = await params;
  const book = getBook(slug);

  let firstVerse: string | undefined;
  let footer: string | undefined;
  if (book) {
    try {
      const data = await getChapter(DEFAULT_VERSION, slug, Number(chapter));
      firstVerse = data.verses[0]?.text;
      footer = `${data.verses.length} versículos · ${versionLabel(data.version).shortName}`;
    } catch {
      // Midvash caído: tarjeta solo con el título
    }
  }

  return renderOgCard({
    eyebrow: book ? (book.testament === "OT" ? "Antiguo Testamento" : "Nuevo Testamento") : "Biblia",
    title: book ? `${book.name} ${chapter}` : "Leer la Biblia",
    body: firstVerse ? `“${truncate(firstVerse, 120)}”` : undefined,
    footer,
  });
}
