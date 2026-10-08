"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Galleria: immagine grande + miniature (verticali su desktop, scorrevoli su mobile) */
export function ProductGallery({
  images,
  alt,
  activeImage,
  badges,
}: {
  images: string[];
  alt: string;
  /** Immagine da mostrare quando cambia la variante scelta */
  activeImage?: string | null;
  badges?: React.ReactNode;
}) {
  // Già al primo render (anche lato server) mostriamo l'immagine della variante preselezionata
  const [current, setCurrent] = useState(activeImage || images[0] || null);
  // La dissolvenza solo quando l'utente cambia immagine: la prima deve comparire subito (LCP)
  const [changed, setChanged] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (activeImage) {
      setCurrent(activeImage);
      setChanged(true);
    }
  }, [activeImage]);

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl border border-paper-line bg-white text-6xl">✏️</div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none md:max-h-[560px] md:w-20 md:flex-col md:overflow-y-auto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => {
                setCurrent(src);
                setChanged(true);
              }}
              aria-label={`Mostra immagine ${i + 1}`}
              aria-current={current === src}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition",
                current === src ? "border-ink" : "border-paper-line hover:border-ink-faint"
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-3xl border border-paper-line bg-white">
        {current && (
          <Image
            key={current}
            src={current}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className={cn("object-contain p-4 sm:p-8", changed && "animate-fade-in")}
          />
        )}
        {badges && <div className="absolute left-4 top-4 flex flex-col gap-1.5">{badges}</div>}
      </div>
    </div>
  );
}
