import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { VideoCard } from "@/components/ui/video-card";
import { content } from "@/lib/content";

const { midia } = content;

export default function Midia() {
  return (
    <section id="midia" aria-labelledby="midia-titulo" className="section divider">
      <div className="container-alpha">
        <div className="reveal max-w-[860px]">
          <span className="eyebrow">{midia.eyebrow}</span>
          <h2 id="midia-titulo" className="section-title">
            <Rich parts={midia.title} />
          </h2>
        </div>

        {/* Mesmos cards de matéria do Alpha_Home. */}
        <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 desk:grid-cols-4">
          {midia.items.map((item) => (
            <li key={item.outlet} className="reveal">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full overflow-hidden rounded-[22px] border border-border bg-bg-1 transition-[transform,border-color] duration-400 hover:-translate-y-1.5 hover:border-border-gold"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1100px) 46vw, 290px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  <span className="absolute top-3.5 left-3.5 z-[1] rounded-full border border-border-gold bg-[rgba(10,10,11,.8)] px-3 py-[6px] text-[10.5px] font-bold tracking-[.08em] text-gold-1 uppercase">
                    {item.outlet}
                  </span>
                  <span
                    className="absolute top-3.5 right-3.5 z-[1] flex h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-[rgba(10,10,11,.8)] text-white transition-colors group-hover:bg-gold-1 group-hover:text-ink"
                    aria-hidden="true"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-[15.5px] leading-[1.4] font-semibold tracking-normal">
                    {item.title}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </h3>
                  <p className="mt-2 text-[13px] leading-[1.6] font-light text-text-muted">{item.text}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>

        {/* Celular: carrossel horizontal com snap; a partir de sm: grade de 3. */}
        <ul className="-mx-[6.4%] mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[6.4%] pb-2 [scrollbar-width:none] sm:mx-auto sm:grid sm:max-w-[860px] sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {midia.videos.map((v) => (
            <li key={v.src} className="w-[68%] shrink-0 snap-center sm:w-auto">
              <VideoCard src={v.src} poster={v.poster} label={v.label} />
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <a href={midia.cta.href} className="btn btn-primary">
            {midia.cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
