import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import type { VerseOfDay } from "@/lib/verse-of-day";

interface VerseOfDayCardProps {
  verse: VerseOfDay;
}

export function VerseOfDayCard({ verse }: VerseOfDayCardProps) {
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <CardContent className="space-y-4 p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Versículo del día
        </div>

        <blockquote className="space-y-3">
          <p className="text-lg leading-relaxed font-medium md:text-xl">
            "{verse.text}"
          </p>
          <footer className="text-sm font-semibold text-primary">
            — {verse.bookName} {verse.chapter}:{verse.verse}
          </footer>
        </blockquote>

        <Link
          href={`/leer/${verse.book}/${verse.chapter}#v${verse.verse}`}
          className="inline-block"
        >
          <Button variant="outline" size="sm" className="gap-2">
            Leer capítulo completo
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}