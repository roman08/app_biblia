"use client";

import { useFocusMode } from "@/lib/hooks/use-focus-mode";
import { FocusModeExit } from "./FocusModeExit";
import { useReaderSpeech } from "@/lib/hooks/use-reader-speech";

interface FocusModeLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}

export function FocusModeLayout({
  children,
  header,
  footer,
}: FocusModeLayoutProps) {
  const { focusMode, mounted } = useFocusMode();
  // Con la barra de reproducción visible el pie es más alto
  const { status } = useReaderSpeech();
  const footerSpacer = status === "idle" ? "h-24" : "h-40";

  // Estado inicial: solo renderizar contenido
  if (!mounted) {
    return (
      <>
        {header}
        {children}
        <div className={footerSpacer} aria-hidden="true" />
        <StickyFooter>{footer}</StickyFooter>
      </>
    );
  }

  // Modo enfoque: solo contenido + botón flotante
  if (focusMode) {
    return (
      <>
        {children}
        <div className="h-24" aria-hidden="true" />
        <FocusModeExit />
      </>
    );
  }

  // Modo normal: header + contenido + spacer + footer sticky
  return (
    <>
      {header}
      {children}
      <div className={footerSpacer} aria-hidden="true" />
      <StickyFooter>{footer}</StickyFooter>
    </>
  );
}

function StickyFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto max-w-2xl px-4 py-2">
        {children}
      </div>
    </div>
  );
}