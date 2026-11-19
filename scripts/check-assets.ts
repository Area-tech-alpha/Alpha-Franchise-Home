// Roda antes do build (npm "prebuild"): toda mídia referenciada no conteúdo
// (e o PDF do material) precisa existir em public/. Se faltar, o build falha em vez de a seção sumir.
import { existsSync } from "node:fs";
import path from "node:path";
import { content } from "@/lib/content";
import { MATERIAL_PDF } from "@/lib/material-content";

const srcs = [
  content.logo.src,
  "/images/hero-bg.webp",
  "/images/hero-bg-mobile.webp",
  "/images/og-franquia.jpg",
  content.escritorios.image.src,
  content.numeros.abf.src,
  ...content.pilares.items.map((p) => p.image.src),
  ...content.midia.items.map((m) => m.image.src),
  ...content.midia.videos.flatMap((v) => [v.src, v.poster]),
  // PDF entregue em /material-geracao-de-demanda/obrigado.
  MATERIAL_PDF,
];

const missing = srcs.filter((src) => !existsSync(path.join(process.cwd(), "public", src)));

if (missing.length > 0) {
  console.error(`[check-assets] ${missing.length} arquivo(s) de mídia faltando em public/:`);
  for (const src of missing) console.error(`  - public${src}`);
  process.exit(1);
}
console.log(`[check-assets] ${srcs.length} arquivos de mídia conferidos em public/.`);
