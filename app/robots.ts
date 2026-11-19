import type { MetadataRoute } from "next";
import { MATERIAL_OBRIGADO_PATH } from "@/lib/material-content";
import { IS_PRODUCTION_SITE, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_SITE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/obrigado", MATERIAL_OBRIGADO_PATH] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
