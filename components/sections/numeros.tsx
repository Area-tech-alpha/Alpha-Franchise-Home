import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { numeros } = content;

export default function Numeros() {
  return (
    <section id="numeros" aria-labelledby="numeros-titulo" className="section divider grid-bg overflow-hidden">
      <div className="container-alpha grid grid-cols-1 items-center gap-12 desk:grid-cols-[.9fr_1.1fr] desk:gap-16">
        <div className="reveal">
          <span className="eyebrow">{numeros.eyebrow}</span>
          <h2 id="numeros-titulo" className="section-title">
            <Rich parts={numeros.title} />
          </h2>
          <Image
            src={numeros.abf.src}
            alt={numeros.abf.alt}
            width={numeros.abf.width}
            height={numeros.abf.height}
            sizes="240px"
            className="mt-9 h-auto w-[220px] sm:w-[240px]"
          />
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {numeros.items.map((item) => (
            <li
              key={item.label}
              className="reveal group relative flex flex-col overflow-hidden rounded-[20px] border border-border bg-[rgba(12,12,12,.85)] p-5 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-border-gold sm:p-7"
            >
              <span
                className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(254,227,47,.16),transparent_70%)] transition-transform duration-500 group-hover:scale-150"
                aria-hidden="true"
              />
              <span className="relative font-display text-[clamp(2.1rem,5vw,3.6rem)] leading-none font-bold text-gold-1 [text-shadow:0_0_24px_rgba(254,227,47,.35)]">
                {item.value}
              </span>
              <span className="relative mt-2 text-[13px] leading-snug text-text-muted sm:text-[14px]">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-alpha mt-12 flex justify-center">
        <a href={numeros.cta.href} className="btn btn-primary">
          {numeros.cta.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
