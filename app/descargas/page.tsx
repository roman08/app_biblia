import { BookDownloads } from "@/components/pwa/BookDownloads";

export const metadata = { title: "Lectura sin conexión" };

export default function DescargasPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Lectura sin conexión</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los capítulos que lees se guardan solos en este dispositivo. Descarga
          libros completos para leerlos en un viaje o donde no haya señal.
        </p>
      </div>

      <BookDownloads />
    </div>
  );
}
