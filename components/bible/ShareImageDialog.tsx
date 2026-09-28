"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";

const COLORS = [
  { name: "Azul", bg: "#0f172a", text: "#ffffff", accent: "#60a5fa" },
  { name: "Crema", bg: "#fef3c7", text: "#1e293b", accent: "#b45309" },
  { name: "Verde", bg: "#064e3b", text: "#ffffff", accent: "#34d399" },
  { name: "Rosa", bg: "#831843", text: "#ffffff", accent: "#f9a8d4" },
];

interface ShareImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: string;
  verseText: string;
}

export function ShareImageDialog({
  open,
  onOpenChange,
  reference,
  verseText,
}: ShareImageDialogProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const color = COLORS[colorIndex];

  const generateImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener contexto"));
        return;
      }

      // Fondo con gradiente sutil
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, color.bg);
      gradient.addColorStop(1, color.bg);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Línea decorativa superior
      ctx.fillStyle = color.accent;
      ctx.fillRect(80, 80, 100, 4);

      // Texto del versículo
      ctx.fillStyle = color.text;
      ctx.font = "500 44px Georgia, serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const maxWidth = size - 160;
      const lines = wrapText(ctx, `"${verseText}"`, maxWidth);

      const lineHeight = 60;
      const totalHeight = lines.length * lineHeight;
      const startY = (size - totalHeight) / 2 - 60;

      lines.forEach((line, i) => {
        ctx.fillText(line, 80, startY + i * lineHeight);
      });

      // Referencia
      ctx.fillStyle = color.accent;
      ctx.font = "600 32px Arial, sans-serif";
      ctx.fillText(`— ${reference}`, 80, startY + totalHeight + 40);

      // Marca
      ctx.fillStyle = color.text;
      ctx.globalAlpha = 0.5;
      ctx.font = "500 24px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("📖 Biblia App", size - 80, size - 60);
      ctx.globalAlpha = 1;

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se generó imagen"));
      }, "image/png");
    });
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await generateImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference.replace(/[: ]/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await generateImage();
      const file = new File([blob], `${reference}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: reference,
          text: `"${verseText}" — ${reference}`,
        });
      } else {
        // Fallback: descargar
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reference}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir imagen</DialogTitle>
          <DialogDescription>
            Elige un estilo y comparte tu versículo
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div
          className="aspect-square w-full rounded-lg p-8 flex flex-col justify-center"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          <div
            className="w-12 h-1 mb-6"
            style={{ backgroundColor: color.accent }}
          />
          <p className="text-lg font-serif leading-relaxed mb-4">
            "{verseText}"
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: color.accent }}
          >
            — {reference}
          </p>
        </div>

        {/* Selector de color */}
        <div className="flex gap-2 justify-center">
          {COLORS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setColorIndex(i)}
              className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${
                i === colorIndex ? "border-foreground" : "border-transparent"
              }`}
              style={{
                backgroundColor: c.bg,
                boxShadow: `inset 0 0 0 2px ${c.accent}`,
              }}
              title={c.name}
            />
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownload}
            disabled={generating}
          >
            <Download className="h-4 w-4" />
            Descargar
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleShare}
            disabled={generating}
          >
            <Copy className="h-4 w-4" />
            {generating ? "Generando..." : "Compartir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}