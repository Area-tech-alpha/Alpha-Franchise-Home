import Image from "next/image";
import { Award, CircleCheck, TrendingUp } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { pilares } = content;
const ICONS = { chart: TrendingUp, check: CircleCheck, award: Award };

export default function Pilares() {
  return (
    <section id="pilares" aria-labelledby="pilares-titulo" className="section divider">
      <div className="container-alpha">
        <h2 id="pilares-titulo" className="section-title reveal max-w-[820px]">
          <Rich parts={pilares.title} />
        </h2>

        <ol className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {pilares.items.map((p, i) => {
            const Icon = ICONS[p.icon];
            return (
              <li
                key={p.title}
                className="reveal group flex flex-col overflow-hidden rounded-[22px] border border-border bg-bg-2 transition-[transform,border-color] duration-500 hover:-translate-y-2 hover:border-border-gold"
              >
                <div className="relative aspect-[6/5] overflow-hidden">
                  <Image
                    src={p.image.src}
                    alt={p.image.alt}
                    fill
                    sizes="(max-width: 768px) 92vw, 380px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-bg-2 via-transparent to-transparent"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute top-4 left-4 font-display text-[44px] leading-none font-bold text-transparent [-webkit-text-stroke:1px_rgba(254,227,47,.8)]"
                    aria-hidden="true"
                  >
                    0{i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 pt-4 sm:p-7 sm:pt-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold tracking-[.14em] text-white uppercase">
                    <Icon className="h-4 w-4 text-gold-1" aria-hidden="true" />
                    {p.tag}
                  </p>
                  <h3 className="em mt-3 text-[clamp(1.4rem,2vw,1.7rem)] leading-tight">{p.title}</h3>
                  <p className="mt-3 text-[14.5px] leading-[1.65] text-text-muted">{p.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
