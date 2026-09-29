import Link from "next/link";
import { BOOKS } from "@/lib/bible-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LeerPage() {
  const oldTestament = BOOKS.filter((b) => b.testament === "OT");
  const newTestament = BOOKS.filter((b) => b.testament === "NT");

 return (
  <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
    <div className="mb-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Button>
      </Link>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Explorar la Biblia</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reina Valera 1960 · Elige un libro
      </p>
    </div>

    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Antiguo Testamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-1.5 xs:grid-cols-3 sm:grid-cols-4">
          {oldTestament.map((book) => (
            <Link
              key={book.slug}
              href={`/leer/${book.slug}/1`}
              className="flex items-center rounded-md px-3 py-2.5 text-sm hover:bg-muted active:bg-muted/80 transition-colors"
            >
              {book.name}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Nuevo Testamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-1.5 xs:grid-cols-3 sm:grid-cols-4">
          {newTestament.map((book) => (
            <Link
              key={book.slug}
              href={`/leer/${book.slug}/1`}
              className="flex items-center rounded-md px-3 py-2.5 text-sm hover:bg-muted active:bg-muted/80 transition-colors"
            >
              {book.name}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);
}