import { content } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: content.meta.siteName,
    url: SITE_URL,
    logo: `${SITE_URL}${content.logo.src}`,
    sameAs: content.footer.socials.map((s) => s.href),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
