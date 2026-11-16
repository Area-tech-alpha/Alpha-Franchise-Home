import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { ecossistema, movimento } = content;

// Diagrama do ecossistema do WP (cards empilhados com setas ↓), redesenhado:
// fluxo vertical no celular e horizontal no desktop, com um pulso percorrendo a
// linha até o selo alpha FRANCHISE.
export default function Ecossistema() {
  return (
    <section id="ecossistema" aria-labelledby="ecossistema-titulo" className="section divider grid-bg overflow-hidden">
      <div className="container-alpha">
        <h2 id="ecossistema-titulo" className="sr-only">
          {ecossistema.label}
        </h2>

        <ol className="relative mx-auto flex max-w-[460px] flex-col items-stretch gap-10 desk:max-w-none desk:flex-row desk:items-stretch desk:gap-6">
          {/* Linha de conexão + pulso animado */}
          <span
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-gradient-to-b from-transparent via-gold-1/35 to-transparent desk:top-1/2 desk:right-0 desk:bottom-auto desk:left-0 desk:h-px desk:w-auto desk:translate-x-0 desk:bg-gradient-to-r"
            aria-hidden="true"
          >
            <span className="flow-pulse absolute top-0 left-0 block h-1/4 w-full bg-gradient-to-b from-transparent via-gold-1 to-transparent desk:h-full desk:w-1/4 desk:bg-gradient-to-r" />
          </span>

          {ecossistema.steps.map((step) => (
            <li key={step.title} className="reveal relative z-[1] flex flex-1 flex-col items-center">
              <div className="group relative w-full flex-1 overflow-hidden rounded-[26px] border border-gold-1/35 bg-bg-0 px-6 py-8 text-center transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-gold-1 hover:shadow-[0_0_50px_rgba(254,227,47,.18)]">
                <span
                  className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(254,227,47,.16),transparent_70%)]"
                  aria-hidden="true"
                />
                <span className="relative block font-display text-[clamp(2.8rem,4.4vw,3.6rem)] leading-none font-bold text-gold-2 [text-shadow:0_0_18px_rgba(255,229,0,.45)]">
                  {step.value}
                </span>
                <h3 className="relative mt-2 mb-3 font-heading text-[22px] font-semibold tracking-[.12em]">
                  {step.title}
                </h3>
                <p className="relative mx-auto max-w-[280px] text-[14.5px] leading-[1.55] text-[#d8d8d8]">{step.text}</p>
              </div>
              <span
                className="absolute -bottom-8 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-gold-1/50 bg-bg-0 text-gold-1 desk:top-1/2 desk:-right-[19px] desk:bottom-auto desk:left-auto desk:translate-x-0 desk:-translate-y-1/2"
                aria-hidden="true"
              >
                <ChevronDown className="h-4 w-4 desk:hidden" />
                <ChevronRight className="hidden h-4 w-4 desk:block" />
              </span>
            </li>
          ))}

          <li className="reveal relative z-[1] flex items-center justify-center desk:w-[220px] desk:flex-none">
            <div className="glow-breathe flex w-[220px] flex-col items-start rounded-[26px] bg-gold-1 px-7 py-6 text-ink">
              <span className="font-display text-[54px] leading-[.9] font-bold tracking-[-0.03em]">
                {ecossistema.brand.top}
              </span>
              <span className="mt-1 text-[14px] font-bold tracking-[.18em]">{ecossistema.brand.bottom}</span>
            </div>
          </li>
        </ol>

        {/* CTA "Faça parte desse movimento" (ao lado do diagrama no WP). */}
        <div className="reveal relative mx-auto mt-24 max-w-[760px] text-center">
          <h2 className="section-title">
            <Rich parts={movimento.title} />
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.7] font-light text-text-muted">
            {movimento.text}
          </p>
          <a href={movimento.cta.href} className="btn btn-primary mt-9">
            {movimento.cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
