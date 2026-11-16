"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

// Vídeo vertical (.mp4 auto-hospedado): só o poster carrega; o vídeo é baixado
// e toca apenas depois do clique.
export function VideoCard({ src, poster, label }: { src: string; poster: string; label: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-[22px] border border-gold-1/40 bg-bg-1 transition-[transform,border-color] duration-400 hover:-translate-y-2 hover:border-gold-1">
      {playing ? (
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          preload="auto"
          aria-label={label}
          className="absolute inset-0 h-full w-full bg-black object-contain"
        >
          <track kind="captions" />
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproduzir: ${label}`}
          className="absolute inset-0 h-full w-full cursor-pointer"
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="(max-width: 768px) 80vw, 340px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20"
            aria-hidden="true"
          />
          <span
            className="absolute top-1/2 left-1/2 z-[1] flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold-1 text-ink shadow-[0_0_0_8px_rgba(254,227,47,.18)] transition-transform duration-300 group-hover:scale-[1.12]"
            aria-hidden="true"
          >
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
