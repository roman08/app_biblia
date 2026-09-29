"use client";

import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReaderSpeech } from "@/lib/hooks/use-reader-speech";
import {
  cycleSpeechRate,
  stopSpeech,
  toggleSpeech,
} from "@/lib/speech/reader-speech";

// Barra de reproducción que aparece sobre la navegación de capítulos
// mientras se lee en voz alta.
export function SpeechPlayerBar() {
  const { status, index, total, rate } = useReaderSpeech();
  if (status === "idle") return null;

  const playing = status === "playing";
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <div className="mb-2 rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={toggleSpeech}
          aria-label={playing ? "Pausar" : "Reanudar"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" aria-live="polite">
            {playing ? "Escuchando" : "En pausa"} · versículo {index + 1} de {total}
          </p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2 font-mono text-xs tabular-nums"
          onClick={cycleSpeechRate}
          aria-label={`Velocidad ${rate}x. Cambiar velocidad`}
          title="Cambiar velocidad"
        >
          {rate}×
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={stopSpeech}
          aria-label="Detener"
          title="Detener"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>
    </div>
  );
}
