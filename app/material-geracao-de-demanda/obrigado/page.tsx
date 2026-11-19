import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { content } from "@/lib/content";
import { MATERIAL_PDF, material } from "@/lib/material-content";

export const metadata: Metadata = {
  title: `${material.obrigado.title} | ${content.meta.siteName}`,
  robots: { index: false, follow: false },
};

// Entrega do material. Não envia lead: o envio já aconteceu no form.
export default function MaterialObrigado() {
  return (
    <main className="grid-bg flex min-h-svh flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="w-full max-w-[520px]">
        <Image
          src={content.logo.src}
          alt={content.logo.alt}
          width={content.logo.width}
          height={content.logo.height}
          priority
          className="mx-auto mb-10 h-8 w-auto"
        />
        <h1 className="text-[clamp(2rem,8vw,3rem)] leading-[1.1]">{material.obrigado.title}</h1>
        <p className="mt-4 text-[15px] text-text-muted sm:text-base">{material.name}</p>
        <a
          href={MATERIAL_PDF}
          target="_blank"
          rel="noopener"
          className="btn btn-primary mt-10 w-full min-h-[64px] text-[14px] sm:w-auto sm:px-12"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          {material.obrigado.download}
        </a>
      </div>
    </main>
  );
}
