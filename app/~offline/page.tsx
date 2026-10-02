import { WifiOff } from "lucide-react";
import { SavedChaptersList } from "@/components/pwa/SavedChaptersList";

export const metadata = { title: "Sin conexión" };

// next-pwa precachea esta página y el service worker la muestra cuando no hay
// red y la página pedida no está guardada (ver next.config.ts).
export default function OfflinePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Estás sin conexión</h1>
        <p className="mt-2 text-muted-foreground">
          Esta página no está guardada en tu dispositivo. Estos son los
          capítulos que puedes leer sin internet.
        </p>
      </div>

      <SavedChaptersList />
    </div>
  );
}
