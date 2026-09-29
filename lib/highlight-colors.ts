// Colores de resaltado de versículos. Los valores viven como tokens en
// app/globals.css (--highlight-*), con variante para modo oscuro.
export const HIGHLIGHT_COLORS = [
  {
    name: "Amarillo",
    value: "yellow",
    swatch: "bg-highlight-yellow",
    text: "bg-highlight-yellow/50 dark:bg-highlight-yellow/25",
  },
  {
    name: "Verde",
    value: "green",
    swatch: "bg-highlight-green",
    text: "bg-highlight-green/50 dark:bg-highlight-green/25",
  },
  {
    name: "Azul",
    value: "blue",
    swatch: "bg-highlight-blue",
    text: "bg-highlight-blue/50 dark:bg-highlight-blue/25",
  },
  {
    name: "Rosa",
    value: "pink",
    swatch: "bg-highlight-pink",
    text: "bg-highlight-pink/50 dark:bg-highlight-pink/25",
  },
] as const;

export function getHighlight(value: string | null | undefined) {
  return HIGHLIGHT_COLORS.find((c) => c.value === value);
}
