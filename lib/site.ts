function stripSlash(url: string) {
  return url.replace(/\/+$/, "");
}

// Domínio definitivo ainda não decidido: a URL vem do ambiente.
export const SITE_URL = stripSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

// Só indexa quando o deploy definitivo liga explicitamente; qualquer outro
// (local, *.vercel.app) sai com noindex.
export const IS_PRODUCTION_SITE = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
