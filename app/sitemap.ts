import type { MetadataRoute } from "next";
import { IS_PRODUCTION_SITE, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    // A /01-lp só entra quando é indexável (mesma regra do noindex dela).
    ...(IS_PRODUCTION_SITE ? [{ url: `${SITE_URL}/01-lp`, changeFrequency: "monthly" as const, priority: 0.7 }] : []),
  ];
}
