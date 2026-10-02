// Genera lib/og/og-assets.ts con las fuentes y el logo de las imágenes Open
// Graph incrustados en base64.
//
//   npx tsx scripts/generate-og-assets.ts
//
// Por qué: en Netlify las imágenes OG dinámicas se generan dentro de una
// función serverless que no incluye assets/ ni public/ (public va al CDN), así
// que leerlos con fs daba HTTP 500. Incrustados en el código viajan con el
// bundle y funcionan en cualquier hosting.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  GELASIO_400: "assets/fonts/gelasio-latin-400-normal.woff",
  GELASIO_600: "assets/fonts/gelasio-latin-600-normal.woff",
  GEIST_400: "assets/fonts/geist-latin-400-normal.woff",
  GEIST_600: "assets/fonts/geist-latin-600-normal.woff",
  ICON_PNG: "public/icons/icon-96.png",
};

let out = `// ARCHIVO GENERADO por scripts/generate-og-assets.ts — no editar a mano.
// Fuentes (OFL) y logo para lib/og/og-card.tsx, en base64.

`;
for (const [name, path] of Object.entries(files)) {
  const b64 = readFileSync(join(root, path)).toString("base64");
  out += `// ${path}\nexport const ${name} = "${b64}";\n\n`;
  console.log(`${name.padEnd(12)} ← ${path} (${(b64.length / 1024).toFixed(0)} KB base64)`);
}

writeFileSync(join(root, "lib/og/og-assets.ts"), out);
console.log("✓ lib/og/og-assets.ts generado");
