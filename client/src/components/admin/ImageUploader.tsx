"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/cn";

/** Upload di una singola immagine (copertina categoria, banner, articolo...) */
export function SingleImageUploader({
  value,
  onChange,
  folder = "products",
  className,
  aspect = "aspect-square",
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  className?: string;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (e) {
      toast.error(errorMessage(e, "Caricamento non riuscito"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border-2 border-dashed border-paper-line bg-paper", aspect, className)}>
      {value ? (
        <>
          <Image src={value} alt="" fill sizes="300px" className="object-contain p-2" />
          <div className="absolute right-2 top-2 flex gap-1">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full bg-white p-2 shadow-card" aria-label="Sostituisci immagine">
              <ImagePlus className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onChange(null)} className="rounded-full bg-white p-2 text-magenta-ink shadow-card" aria-label="Rimuovi immagine">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-600"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {loading ? "Caricamento…" : "Carica immagine"}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

/**
 * Galleria prodotto: la prima immagine è la copertina. Si possono caricare più
 * file insieme, riordinare con le frecce e scegliere la copertina.
 */
export function GalleryUploader({
  images,
  onChange,
  folder = "products",
}: {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(0);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setLoading(list.length);
    const urls: string[] = [];
    for (const file of list) {
      try {
        urls.push(await uploadImage(file, folder));
      } catch (e) {
        toast.error(`${file.name}: ${errorMessage(e, "caricamento non riuscito")}`);
      } finally {
        setLoading((n) => n - 1);
      }
    }
    onChange([...images, ...urls]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {images.map((src, i) => (
        <div key={src + i} className={cn("group relative aspect-square overflow-hidden rounded-xl border bg-white", i === 0 ? "border-brand-500 ring-2 ring-brand-500/20" : "border-paper-line")}>
          <Image src={src} alt="" fill sizes="160px" className="object-contain p-1.5" />
          {i === 0 && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Copertina</span>
          )}
          <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Sposta a sinistra"><ArrowLeft className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Sposta a destra"><ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex gap-1">
              {i > 0 && (
                <button type="button" onClick={() => onChange([src, ...images.filter((_, k) => k !== i)])} className="rounded-full bg-white p-1.5 shadow" aria-label="Usa come copertina"><Star className="h-3.5 w-3.5" /></button>
              )}
              <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="rounded-full bg-white p-1.5 text-magenta-ink shadow" aria-label="Rimuovi immagine"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-paper-line text-xs font-semibold text-ink-muted hover:border-brand-500 hover:text-brand-600"
      >
        {loading > 0 ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        {loading > 0 ? `Carico ${loading}…` : "Aggiungi foto"}
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
