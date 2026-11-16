import Image from "next/image";
import { Award, Building2, TrendingUp } from "lucide-react";
import LeadForm from "@/components/lead-form";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { hero } = content;
const BADGE_ICONS = [Award, Building2, TrendingUp];

// Primeira dobra igual à do WP: chamada à esquerda e formulário à direita (lg+);
// no celular, selos → título → subtítulo → formulário.
export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-titulo"
      className="relative overflow-hidden pt-[104px] pb-14 lg:flex lg:min-h-svh lg:items-center lg:pt-[96px] lg:pb-8"
    >
      {/* Fundo do WP (versões desktop e mobile), decorativo. ~10 KB cada: carrega
          com prioridade porque no celular é o elemento de LCP. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image src="/images/hero-bg-mobile.webp" alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
        <Image src="/images/hero-bg.webp" alt="" fill priority sizes="100vw" className="hidden object-cover md:block" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_18%_45%,rgba(254,227,47,.10),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg-0" />
      </div>

      {/* Container mais largo que o das outras seções: com o form ao lado, a
          coluna do título precisa de espaço (senão o H1 quebra em 7 linhas). */}
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-9 px-[6%] lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-12 lg:px-[5%] xl:grid-cols-[minmax(0,1fr)_minmax(0,540px)] xl:gap-16">
        <div>
          <ul className="mb-6 flex flex-wrap gap-2">
            {hero.badges.map((badge, i) => {
              const Icon = BADGE_ICONS[i];
              return (
                <li
                  key={badge}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
                    i === 0
                      ? "border-gold-1 bg-gold-1 text-ink"
                      : "border-border-strong bg-[rgba(10,10,10,.6)] text-white backdrop-blur-[6px]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${i === 0 ? "" : "text-gold-1"}`} aria-hidden="true" />
                  {badge}
                </li>
              );
            })}
          </ul>

          <h1
            id="hero-titulo"
            className="text-[clamp(2.35rem,3.9vw,4rem)] leading-[1.04] font-bold tracking-[-0.025em]"
          >
            <Rich parts={hero.title} />
          </h1>

          <p className="mt-5 max-w-[480px] text-[clamp(1rem,1.25vw,1.15rem)] leading-[1.6] font-light text-text-muted">
            {hero.subtitle}
          </p>

          <p className="mt-5 flex items-center gap-2.5 text-[13.5px] text-text-muted">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-1 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-1" />
            </span>
            {hero.note}
          </p>
        </div>

        {/* Destino de todos os CTAs da página (#form). */}
        <div
          id="form"
          className="relative scroll-mt-24 rounded-[22px] border border-border-strong bg-[linear-gradient(180deg,rgba(254,227,47,.07),rgba(12,12,12,.92)_30%)] px-4 py-5 shadow-[0_40px_100px_rgba(0,0,0,.55)] backdrop-blur-[8px] sm:px-6 sm:py-6"
        >
          <div
            className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-gold-1 to-transparent"
            aria-hidden="true"
          />
          <h2 className="sr-only">Formulário de aplicação</h2>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
