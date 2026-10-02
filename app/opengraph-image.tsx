import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/og-card";

export const alt = "Biblia App: lee, medita y estudia la Palabra de Dios";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Imagen por defecto al compartir cualquier página sin imagen propia
export default function Image() {
  return renderOgCard({
    eyebrow: "La Biblia Reina-Valera",
    title: "Lee, medita y estudia la Palabra",
    body: "Planes de lectura, notas, racha diaria y versículos para compartir.",
    footer: "También sin conexión",
  });
}
