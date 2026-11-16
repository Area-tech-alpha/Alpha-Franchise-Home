import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { OrganizationJsonLd } from "@/components/json-ld";
import { content } from "@/lib/content";
import { IS_PRODUCTION_SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Mesmas famílias do Alpha_Home, auto-hospedadas em public/fonts, mais a
// Playfair Display itálica dos destaques da LP no WP.
const clashDisplay = localFont({
  src: [
    { path: "../public/fonts/ClashDisplay-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/ClashDisplay-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

const generalSans = localFont({
  src: [{ path: "../public/fonts/GeneralSans-600.woff2", weight: "600", style: "normal" }],
  variable: "--font-general-sans",
  display: "swap",
  preload: false,
});

const inter = localFont({
  src: "../public/fonts/Inter-latin.woff2",
  weight: "300 700",
  variable: "--font-inter",
  display: "swap",
});

const playfair = localFont({
  src: "../public/fonts/PlayfairDisplay-500-Italic-latin.woff2",
  weight: "500",
  style: "italic",
  variable: "--font-playfair",
  display: "swap",
  // Fallback serifado com métricas ajustadas, para a troca mexer menos no layout.
  adjustFontFallback: "Times New Roman",
});

export const viewport: Viewport = {
  themeColor: "#050505",
};

const { meta } = content;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/" },
  robots: IS_PRODUCTION_SITE ? undefined : { index: false, follow: false },
  openGraph: {
    title: meta.ogTitle,
    description: meta.ogDescription,
    locale: "pt_BR",
    type: "website",
    url: "/",
    siteName: meta.siteName,
    // Mesma arte do og:image da LP no WP.
    images: [{ url: "/images/og-franquia.jpg", width: 1200, height: 630, alt: content.escritorios.image.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.ogTitle,
    description: meta.ogDescription,
    images: ["/images/og-franquia.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${clashDisplay.variable} ${generalSans.variable} ${inter.variable} ${playfair.variable}`}
    >
      <head>
        <OrganizationJsonLd />
      </head>
      <body>{children}</body>
    </html>
  );
}
