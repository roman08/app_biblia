// Clasificación de los 66 libros por género (canon protestante, división
// tradicional en español). El testamento sale de BOOKS; aquí solo el género.
//
// Es un Record<BookSlug, …>: si falta un libro o sobra uno, TypeScript no
// compila. scripts/validate-books.ts verifica además que cada género sea del
// testamento correcto y que BOOKS coincida con fuentes externas.

import { getBook, type BookSlug } from "@/lib/bible-api";

export type BookCategory =
  | "Pentateuco"
  | "Históricos"
  | "Poéticos"
  | "Profetas mayores"
  | "Profetas menores"
  | "Evangelios"
  | "Hechos"
  | "Epístolas"
  | "Apocalipsis";

/** Géneros que pertenecen a cada testamento (para validar) */
export const CATEGORY_TESTAMENT: Record<BookCategory, "OT" | "NT"> = {
  Pentateuco: "OT",
  Históricos: "OT",
  Poéticos: "OT",
  "Profetas mayores": "OT",
  "Profetas menores": "OT",
  Evangelios: "NT",
  Hechos: "NT",
  Epístolas: "NT",
  Apocalipsis: "NT",
};

export const BOOK_CATEGORY: Record<BookSlug, BookCategory> = {
  // ── Antiguo Testamento ──
  genesis: "Pentateuco",
  exodo: "Pentateuco",
  levitico: "Pentateuco",
  numeros: "Pentateuco",
  deuteronomio: "Pentateuco",
  josue: "Históricos",
  jueces: "Históricos",
  rut: "Históricos",
  "1-samuel": "Históricos",
  "2-samuel": "Históricos",
  "1-reyes": "Históricos",
  "2-reyes": "Históricos",
  "1-cronicas": "Históricos",
  "2-cronicas": "Históricos",
  esdras: "Históricos",
  nehemias: "Históricos",
  ester: "Históricos",
  job: "Poéticos",
  salmos: "Poéticos",
  proverbios: "Poéticos",
  eclesiastes: "Poéticos",
  cantares: "Poéticos",
  isaias: "Profetas mayores",
  jeremias: "Profetas mayores",
  lamentaciones: "Profetas mayores",
  ezequiel: "Profetas mayores",
  daniel: "Profetas mayores",
  oseas: "Profetas menores",
  joel: "Profetas menores",
  amos: "Profetas menores",
  abdias: "Profetas menores",
  jonas: "Profetas menores",
  miqueas: "Profetas menores",
  nahum: "Profetas menores",
  habacuc: "Profetas menores",
  sofonias: "Profetas menores",
  hageo: "Profetas menores",
  zacarias: "Profetas menores",
  malaquias: "Profetas menores",
  // ── Nuevo Testamento ──
  mateo: "Evangelios",
  marcos: "Evangelios",
  lucas: "Evangelios",
  juan: "Evangelios",
  hechos: "Hechos",
  romanos: "Epístolas",
  "1-corintios": "Epístolas",
  "2-corintios": "Epístolas",
  galatas: "Epístolas",
  efesios: "Epístolas",
  filipenses: "Epístolas",
  colosenses: "Epístolas",
  "1-tesalonicenses": "Epístolas",
  "2-tesalonicenses": "Epístolas",
  "1-timoteo": "Epístolas",
  "2-timoteo": "Epístolas",
  tito: "Epístolas",
  filemon: "Epístolas",
  hebreos: "Epístolas",
  santiago: "Epístolas",
  "1-pedro": "Epístolas",
  "2-pedro": "Epístolas",
  "1-juan": "Epístolas",
  "2-juan": "Epístolas",
  "3-juan": "Epístolas",
  judas: "Epístolas",
  apocalipsis: "Apocalipsis",
};

export interface BookTag {
  testament: "OT" | "NT";
  /** "AT" o "NT", para mostrar */
  testamentShort: "AT" | "NT";
  category: BookCategory;
  /** Clases de color de la etiqueta (tokens de globals.css) */
  className: string;
}

/**
 * Etiqueta de un libro a partir del propio libro (nunca de la posición de la
 * lectura en el día). `null` si el slug no existe.
 */
export function getBookTag(slug: string): BookTag | null {
  const book = getBook(slug);
  if (!book) return null;
  const category = BOOK_CATEGORY[book.slug];
  return {
    testament: book.testament,
    testamentShort: book.testament === "OT" ? "AT" : "NT",
    category,
    className:
      book.testament === "OT"
        ? "bg-tag-amber/10 text-tag-amber"
        : "bg-tag-blue/10 text-tag-blue",
  };
}
