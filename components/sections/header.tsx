import Image from "next/image";
import MobileMenu from "@/components/ui/mobile-menu";
import { content } from "@/lib/content";

const { nav, logo } = content;

export default function Header() {
  return (
    <header className="fixed top-3.5 left-1/2 z-[1000] flex w-[92%] max-w-[1180px] -translate-x-1/2 items-center justify-between rounded-full border border-border bg-[rgba(8,8,8,.8)] py-2.5 pr-3 pl-[22px] backdrop-blur-[10px] md:top-[18px] md:w-[90%] lg:pr-2.5">
      <a href="#hero" aria-label={`${logo.alt}, início`} className="flex items-center">
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          priority
          sizes="112px"
          className="h-[34px] w-auto object-contain"
        />
      </a>

      <nav aria-label="Principal" className="hidden lg:block">
        <ul className="flex items-center gap-[clamp(14px,1.8vw,26px)]">
          {nav.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="relative text-[13.5px] whitespace-nowrap text-text-muted transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold-1 after:transition-[width] after:duration-300 hover:text-white hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <a href={nav.cta.href} className="btn btn-primary btn-sm hidden rounded-full lg:inline-flex">
        {nav.cta.label}
      </a>

      <MobileMenu links={nav.links} cta={nav.cta} />
    </header>
  );
}
