import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parseReference } from "@/lib/parse-reference";
import { pageMetadata } from "@/lib/site";
import { ReferenceSearch } from "@/components/search/ReferenceSearch";

export const metadata: Metadata = pageMetadata({
  title: "Buscar",
  description: "Ve directo a cualquier libro, capítulo o versículo de la Biblia.",
  path: "/buscar",
});

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;

  // /buscar?q=juan+3:16 con una cita válida va directo al lector
  if (q) {
    const result = parseReference(q);
    if (result.ok) redirect(result.href);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Buscar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ve directo a cualquier libro, capítulo o versículo.
        </p>
      </div>

      <ReferenceSearch initialQuery={q} />
    </div>
  );
}
