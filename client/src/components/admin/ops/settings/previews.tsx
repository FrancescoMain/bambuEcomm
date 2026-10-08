"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Clock, Mail, Truck, X } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { SERVICE_ICONS } from "@/components/shop/icons";
import { cn } from "@/lib/cn";

/** Barra nera in alto con i messaggi che si alternano */
export function TopBarPreview({ messages }: { messages: string[] }) {
  const list = messages.map((m) => m.trim()).filter(Boolean);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 2500);
    return () => clearInterval(id);
  }, [list.length]);
  if (!list.length) return <p className="text-sm text-ink-muted">Nessun messaggio: la barra non verrà mostrata.</p>;
  return (
    <div className="space-y-2.5">
      <div className="flex h-9 items-center justify-center overflow-hidden rounded-xl bg-ink px-4 text-[13px] font-semibold tracking-wide text-white">
        <p key={index % list.length} className="animate-fade-in truncate">
          {list[index % list.length]}
        </p>
      </div>
      {list.length > 1 && (
        <ol className="space-y-1 text-xs text-ink-soft">
          {list.map((m, i) => (
            <li key={`${i}-${m}`} className="flex gap-2">
              <span className="w-4 shrink-0 text-right font-bold text-ink-faint">{i + 1}.</span>
              <span className="min-w-0">{m}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function CountdownPreview({ titolo, data }: { titolo: string; data: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const target = data ? new Date(data).getTime() : NaN;
  if (now === null) return null;
  if (!data || Number.isNaN(target)) return <p className="text-sm text-ink-muted">Scegli data e ora per vedere l&apos;anteprima.</p>;
  if (target <= now) return <p className="text-sm font-semibold text-magenta-ink">La data è già passata: il countdown non viene mostrato.</p>;
  const diff = target - now;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return (
    <div className="rounded-xl bg-gradient-to-r from-orange via-magenta to-sky px-3 py-2 text-center text-sm font-bold text-white">
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        {titolo || "Titolo del countdown"} ·{" "}
        <span className="rounded-full bg-white/20 px-2 py-0.5">{days > 0 ? `${days} giorni` : `${hours} ore`}</span>
      </span>
    </div>
  );
}

const BANNER_TONES: Record<string, { bg: string; chip: string }> = {
  orange: { bg: "from-orange-soft to-white", chip: "bg-orange text-white" },
  magenta: { bg: "from-magenta-soft to-white", chip: "bg-magenta text-white" },
  blue: { bg: "from-sky-soft to-white", chip: "bg-sky text-white" },
  green: { bg: "from-brand-50 to-white", chip: "bg-brand-600 text-white" },
};
const FALLBACK_IMAGES = ["/negozio/parete-zaini.webp", "/negozio/espositore-posca.webp", "/negozio/soppalco.webp"];

/** Banner della home in miniatura (stessi colori dello slider) */
export function BannerPreview({ banner, index }: { banner: StoreSettings["banner"][number]; index: number }) {
  const tone = BANNER_TONES[banner.colore || "green"] ?? BANNER_TONES.green;
  const image = banner.immagine || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  return (
    <div className={cn("grid min-h-[9.5rem] grid-cols-[minmax(0,1fr)_38%] overflow-hidden rounded-2xl border border-paper-line bg-gradient-to-br", tone.bg)}>
      <div className="flex min-w-0 flex-col justify-center gap-1.5 p-3.5">
        <span className={cn("w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", tone.chip)}>Cartoleria Bambù</span>
        <p className="line-clamp-2 text-base font-extrabold leading-tight">{banner.titolo || "Titolo del banner"}</p>
        {banner.sottotitolo && <p className="line-clamp-2 text-[11px] text-ink-soft">{banner.sottotitolo}</p>}
        {banner.link && (
          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-white">
            {banner.cta || "Scopri di più"} <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="relative">
        <Image src={image} alt="" fill sizes="160px" className="object-cover" />
        {!banner.immagine && (
          <span className="absolute inset-x-1 bottom-1 rounded-md bg-white/85 px-1.5 py-0.5 text-center text-[9px] font-semibold text-ink-soft">
            Foto del negozio (predefinita)
          </span>
        )}
      </div>
    </div>
  );
}

const TILE_TONES: Record<string, string> = {
  orange: "bg-orange-soft text-orange-ink",
  magenta: "bg-magenta-soft text-magenta-ink",
  green: "bg-leaf-soft text-leaf-ink",
  blue: "bg-sky-soft text-sky-ink",
};

export function TilePreview({ tile }: { tile: StoreSettings["vetrine"][number] }) {
  return (
    <div className={cn("relative flex min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-2xl p-3.5", TILE_TONES[tile.colore || "green"] ?? TILE_TONES.green)}>
      {tile.immagine && <Image src={tile.immagine} alt="" fill sizes="200px" className="object-cover opacity-90" />}
      <div className={cn("relative", tile.immagine && "rounded-xl bg-white/85 p-2 backdrop-blur")}>
        <p className="text-lg font-extrabold leading-tight text-ink">{tile.titolo || "Titolo"}</p>
        {tile.testo && <p className="text-xs font-medium opacity-80">{tile.testo}</p>}
      </div>
      <span className="relative ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-sm">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </div>
  );
}

const SERVICE_TINTS = ["text-orange bg-orange-soft", "text-magenta bg-magenta-soft", "text-brand-600 bg-brand-50", "text-sky bg-sky-soft"];

export function ServicePreview({ servizio, index }: { servizio: StoreSettings["servizi"][number]; index: number }) {
  const Icon = SERVICE_ICONS[servizio.icona] || Truck;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-paper-line bg-white p-3.5">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", SERVICE_TINTS[index % SERVICE_TINTS.length])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{servizio.titolo || "Titolo"}</p>
        <p className="truncate text-xs text-ink-muted">{servizio.descrizione}</p>
      </div>
    </div>
  );
}

export function PopupPreview({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="relative mx-auto max-w-sm rounded-3xl bg-white p-5 text-center shadow-lift">
      <span className="absolute right-3 top-3 rounded-full p-1 text-ink-faint">
        <X className="h-4 w-4" />
      </span>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Mail className="h-6 w-6" />
      </span>
      <p className="mt-3 text-lg font-extrabold">{titolo || "Titolo del popup"}</p>
      {testo && <p className="mt-1 text-sm text-ink-muted">{testo}</p>}
      <div className="mt-4 flex gap-2">
        <span className="flex-1 rounded-xl border border-paper-line px-3 py-2 text-left text-sm text-ink-faint">La tua email</span>
        <span className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">Iscriviti</span>
      </div>
    </div>
  );
}
