import type { Metadata } from "next";
import Image from "next/image";
import MaterialForm from "@/components/material-form";
import { content } from "@/lib/content";
import { MATERIAL_PATH, material } from "@/lib/material-content";

export const metadata: Metadata = {
  title: `${material.name} | ${content.meta.siteName}`,
  description: material.title,
  alternates: { canonical: MATERIAL_PATH },
  robots: { index: false, follow: false },
};

// LP de captura do material: título, nome do material e form de 3 campos.
// Sem efeitos e sem pixel; o lead vai para o CRM no envio (submit-material-lead).
export default function MaterialPage() {
  return (
    <main className="grid-bg flex min-h-svh flex-col items-center px-4 py-8 sm:justify-center sm:px-6 sm:py-14">
      <div className="w-full max-w-[480px]">
        <Image
          src={content.logo.src}
          alt={content.logo.alt}
          width={content.logo.width}
          height={content.logo.height}
          priority
          className="mx-auto mb-8 h-8 w-auto sm:mb-10"
        />

        <h1 className="text-center text-[clamp(1.6rem,6.4vw,2.4rem)] leading-[1.15]">{material.title}</h1>
        <p className="mt-4 text-center text-[15px] text-text-muted sm:text-base">
          Material: <strong className="font-semibold text-gold-1">{material.name}</strong>
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-bg-1/80 p-5 sm:p-7">
          <MaterialForm />
        </div>
      </div>
    </main>
  );
}
