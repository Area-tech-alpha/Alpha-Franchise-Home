import { ArrowRight, CircleCheck } from "lucide-react";
import { Rich } from "@/components/ui/title";
import { content } from "@/lib/content";

const { risco } = content;

export default function Risco() {
  return (
    <section id="risco" aria-labelledby="risco-titulo" className="section divider overflow-hidden">
      <div
        className="pointer-events-none absolute top-1/2 -right-40 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(254,227,47,.13),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="container-alpha relative grid grid-cols-1 items-center gap-12 desk:grid-cols-2 desk:gap-16">
        <div className="reveal">
          <span className="eyebrow">{risco.eyebrow}</span>
          <h2 id="risco-titulo" className="section-title">
            <Rich parts={risco.title} />
          </h2>
          <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] font-light text-text-muted">
            <Rich parts={risco.text} emClassName="font-semibold text-white" />
          </p>
          <a href={risco.cta.href} className="btn btn-primary mt-9">
            {risco.cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <ul className="flex flex-col gap-5">
          {risco.vantagens.map((v, i) => (
            <li
              key={v.title}
              className={`reveal group relative overflow-hidden rounded-[22px] border border-border bg-bg-2 p-7 transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-border-gold sm:p-8 ${
                i === 1 ? "desk:ml-12" : "desk:mr-12"
              }`}
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-1 via-gold-1/40 to-transparent"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(254,227,47,.12),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-6">
                <h3 className="text-[clamp(1.4rem,2.2vw,1.75rem)] leading-[1.1]">{v.title}</h3>
                <CircleCheck className="h-8 w-8 shrink-0 text-gold-1" aria-hidden="true" />
              </div>
              <p className="mt-4 text-[15px] leading-[1.65] text-text-muted">
                <Rich parts={v.text} emClassName="font-semibold text-white" />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
