import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { content } from "@/lib/content";

const { obrigado } = content;

export const metadata: Metadata = {
  title: `${obrigado.title} | ${content.meta.siteName}`,
  robots: { index: false, follow: false },
};

// Texto literal das páginas obrigado-seja-um-franqueado-a/-b do WP.
export default function Obrigado() {
  return (
    <main className="grid-bg flex min-h-screen items-center justify-center px-[6%] py-20 text-center">
      <div className="max-w-[600px]">
        <CircleCheck className="mx-auto mb-6 h-14 w-14 text-gold-1" aria-hidden="true" />
        <h1 className="mb-5 text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.1] font-bold">{obrigado.title}</h1>
        <p className="mb-10 text-[17px] leading-[1.65] font-light text-text-muted">{obrigado.text}</p>
        <Link href="/" className="btn btn-primary">
          {obrigado.back}
        </Link>
      </div>
    </main>
  );
}
