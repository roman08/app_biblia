"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowRight } from "lucide-react";
import { getLastRead, type LastRead } from "@/lib/reading-history";

export function ContinueReadingCard() {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLastRead(getLastRead());
    setLoaded(true);
  }, []);

  // Evitamos hydration mismatch: no renderizamos hasta que se lea localStorage
  if (!loaded || !lastRead) return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Continuar leyendo
            </p>
            <p className="font-semibold truncate">
              {lastRead.bookName} {lastRead.chapter}
            </p>
          </div>
        </div>
        <Link href={`/leer/${lastRead.book}/${lastRead.chapter}`}>
          <Button size="sm" className="gap-2 shrink-0">
            Retomar
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}