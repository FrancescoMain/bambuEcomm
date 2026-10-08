import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  orange: "bg-orange-soft text-orange-ink",
  magenta: "bg-magenta-soft text-magenta-ink",
  green: "bg-leaf-soft text-leaf-ink",
  blue: "bg-sky-soft text-sky-ink",
};

/** Vetrine della home (4 riquadri modificabili dal pannello) */
export function ShowcaseTiles({ tiles }: { tiles: StoreSettings["vetrine"] }) {
  if (!tiles.length) return null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {tiles.map((t) => (
        <Link
          key={t.titolo}
          href={t.link}
          className={cn(
            "group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-lift sm:min-h-[190px] sm:p-6",
            TONES[t.colore || "green"] || TONES.green
          )}
        >
          {t.immagine && (
            <Image src={t.immagine} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-90 transition duration-500 group-hover:scale-105" />
          )}
          <div className={cn("relative", t.immagine && "rounded-2xl bg-white/85 p-3 backdrop-blur")}>
            <p className="text-xl font-extrabold text-ink sm:text-2xl">{t.titolo}</p>
            {t.testo && <p className="mt-0.5 text-sm font-medium opacity-80">{t.testo}</p>}
          </div>
          <span className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-sm transition group-hover:bg-ink group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </Link>
      ))}
    </section>
  );
}
