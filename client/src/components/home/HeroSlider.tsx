"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/cn";

type Banner = StoreSettings["banner"][number];

const TONES: Record<string, { bg: string; chip: string }> = {
  orange: { bg: "from-orange-soft to-white", chip: "bg-orange text-white" },
  magenta: { bg: "from-magenta-soft to-white", chip: "bg-magenta text-white" },
  blue: { bg: "from-sky-soft to-white", chip: "bg-sky text-white" },
  green: { bg: "from-brand-50 to-white", chip: "bg-brand-600 text-white" },
};

// Foto del negozio usate quando il banner non ha un'immagine propria
const FALLBACK_IMAGES = ["/negozio/parete-zaini.webp", "/negozio/espositore-posca.webp", "/negozio/soppalco.webp"];

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(id);
  }, [count, paused]);

  if (!count) return null;

  return (
    <section
      className="relative"
      aria-roledescription="carosello"
      aria-label="In evidenza"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl">
        {banners.map((b, i) => {
          const tone = TONES[b.colore || "green"] || TONES.green;
          const image = b.immagine || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
          const active = i === index;
          return (
            <div
              key={i}
              aria-hidden={!active}
              className={cn(
                "grid min-h-[440px] grid-cols-1 bg-gradient-to-br transition-opacity duration-700 md:min-h-[460px] md:grid-cols-2",
                tone.bg,
                active ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
              )}
            >
              <div className="order-2 flex flex-col justify-center gap-4 p-7 sm:p-10 md:order-1 lg:p-14">
                <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", tone.chip)}>
                  Cartoleria Bambù
                </span>
                {i === 0 ? (
                  <h1 className="text-balance text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{b.titolo}</h1>
                ) : (
                  <p className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                    {b.titolo}
                  </p>
                )}
                {b.sottotitolo && <p className="max-w-md text-lg text-ink-soft">{b.sottotitolo}</p>}
                {b.link && (
                  <Link
                    href={b.link}
                    tabIndex={active ? 0 : -1}
                    className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-brand-700"
                  >
                    {b.cta || "Scopri di più"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
              <div className="relative order-1 h-56 sm:h-72 md:order-2 md:h-auto">
                <Image
                  src={image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/70 p-1 backdrop-blur md:bottom-4 md:left-10 md:right-auto md:top-auto md:bg-transparent md:p-0 md:backdrop-blur-none lg:left-14">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-card hover:bg-white"
            aria-label="Banner precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Vai al banner ${i + 1}`}
              aria-current={i === index}
              className={cn("h-2 rounded-full transition-all", i === index ? "w-7 bg-ink" : "w-2 bg-ink/25")}
            />
          ))}
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-card hover:bg-white"
            aria-label="Banner successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
