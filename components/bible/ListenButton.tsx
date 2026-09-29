"use client";

import { Headphones, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReaderSpeech } from "@/lib/hooks/use-reader-speech";
import { toggleSpeech } from "@/lib/speech/reader-speech";

export function ListenButton() {
  const { supported, status } = useReaderSpeech();

  // Sin soporte de voz en este navegador: no mostramos el botón
  if (!supported) return null;

  const label =
    status === "playing" ? "Pausar" : status === "paused" ? "Reanudar" : "Escuchar";
  const Icon = status === "playing" ? Pause : status === "paused" ? Play : Headphones;

  return (
    <Button
      variant={status === "idle" ? "outline" : "default"}
      size="sm"
      className="gap-1.5"
      onClick={toggleSpeech}
      aria-label={`${label} capítulo`}
      title={`${label} capítulo (L)`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
