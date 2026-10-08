"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Mappa Google incorporata solo dopo un clic: Google Maps imposta cookie di terze
 * parti, quindi non la carichiamo senza che il visitatore lo chieda (e la pagina
 * resta più leggera). Il link "Apri in Google Maps" funziona sempre.
 */
export function MapEmbed({
  query,
  title,
  href,
  className,
}: {
  query: string;
  title: string;
  /** link "Apri in Google Maps" */
  href?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=it&z=17&output=embed`;
  const external = href || `https://maps.google.com/?q=${encodeURIComponent(query)}`;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-paper-line bg-paper-warm bg-confetti", className)}>
      {loaded ? (
        <iframe
          src={src}
          title={title}
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
            <MapPin className="h-7 w-7" aria-hidden />
          </span>
          <p className="max-w-xs font-semibold text-ink-soft">{query}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink-soft"
            >
              Mostra la mappa
            </button>
            <a
              href={external}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              Apri in Google Maps
            </a>
          </div>
          <p className="max-w-xs text-xs text-ink-muted">
            Caricando la mappa accetti i cookie di Google Maps.
          </p>
        </div>
      )}
    </div>
  );
}
