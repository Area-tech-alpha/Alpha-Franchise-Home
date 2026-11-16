import Image from "next/image";
import { Infinity as InfinityIcon, Target, TrendingUp } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { escritorios } = content;
const ICONS = { target: Target, trend: TrendingUp, infinity: InfinityIcon };

export default function Escritorios() {
  return (
    <section id="escritorios" aria-labelledby="escritorios-titulo" className="section divider overflow-hidden">
      <div className="container-alpha grid grid-cols-1 items-center gap-14 desk:grid-cols-[1.05fr_.95fr]">
        <div className="reveal">
          <span className="eyebrow">{escritorios.eyebrow}</span>
          <h2 id="escritorios-titulo" className="section-title">
            <Rich parts={escritorios.title} />
          </h2>
          <p className="mt-6 max-w-[500px] text-[16px] leading-[1.7] font-light text-text-muted">
            <Rich parts={escritorios.text} emClassName="font-semibold text-white" />
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {escritorios.stats.map((s) => {
              const Icon = ICONS[s.icon];
              return (
                <li
                  key={s.value}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-glass p-5 transition-colors hover:border-border-gold sm:flex-col sm:items-start"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-1/10 text-gold-1">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="flex flex-col">
                    <span className="font-heading text-[16px] leading-tight font-semibold text-white">{s.value}</span>
                    <span className="text-[13px] text-text-muted">{s.label}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="reveal relative mx-auto w-full max-w-[520px]">
          <div
            className="absolute inset-[8%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(254,227,47,.22),transparent_65%)] blur-2xl"
            aria-hidden="true"
          />
          <Image
            src={escritorios.image.src}
            alt={escritorios.image.alt}
            width={escritorios.image.width}
            height={escritorios.image.height}
            sizes="(max-width: 1100px) 90vw, 520px"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
