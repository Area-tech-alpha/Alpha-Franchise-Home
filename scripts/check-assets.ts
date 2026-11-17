// Roda antes do build (npm "prebuild"): toda mídia referenciada no conteúdo
// precisa existir em public/. Se faltar, o build falha em vez de a seção sumir.
import { existsSync } from "node:fs";
import path from "node:path";
import { content } from "@/lib/content";
import { content01lp } from "@/lib/content-01-lp";

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
  // /01-lp e páginas de obrigado dela (/obrigado-a, -b, -c, /agradecimento)
  content01lp.logo.src,
  content01lp.heroLogo.src,
  content01lp.footerLogo.src,
  content01lp.hero.background,
  content01lp.hero.backgroundMobile,
  content01lp.metodo.rotulos.src,
  content01lp.faq.icon,
  content01lp.meta.ogImage.src,
  content01lp.quemSomos.image.src,
  content01lp.metodo.video.src,
  content01lp.metodo.video.poster,
  ...content01lp.servicos.cards.map((card) => card.src),
  content01lp.planos.image.src,
  content01lp.obrigado.video.poster,
  ...content01lp.depoimentos.shorts.map((id) => `/images/depoimentos/short-${id}.jpg`),
  "/fonts/Montserrat-latin.woff2",
  "/fonts/Roboto-latin.woff2",
  "/fonts/PublicSans-latin.woff2",
];

const missing = srcs.filter((src) => !existsSync(path.join(process.cwd(), "public", src)));

if (missing.length > 0) {
  console.error(`[check-assets] ${missing.length} arquivo(s) de mídia faltando em public/:`);
  for (const src of missing) console.error(`  - public${src}`);
  process.exit(1);
}
console.log(`[check-assets] ${srcs.length} arquivos de mídia conferidos em public/.`);
