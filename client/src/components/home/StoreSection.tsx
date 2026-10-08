import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Navigation, Store } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { buttonClass } from "@/components/ui/Button";

/** "Vieni a trovarci": foto del negozio, indirizzo, orari e ritiro gratuito */
export function StoreSection({ settings }: { settings: StoreSettings }) {
  const { contatti, spedizione } = settings;
  return (
    <section className="grid overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-2">
      <div className="relative min-h-[280px]">
        <Image src="/negozio/espositore-posca.webp" alt="L'interno della Cartoleria Bambù" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
        <span className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <Store className="h-3.5 w-3.5" /> Il negozio
        </span>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Vieni a trovarci a Torre Annunziata</h2>
        <p className="text-white/75">
          Dal 2016 siamo il punto di riferimento per scuola, ufficio e tempo libero. Ordina online e
          {spedizione.ritiroInNegozio ? " ritira gratis in negozio" : " ricevi tutto a casa"}, oppure passa a scoprire le novità.
        </p>
        <ul className="space-y-2 text-[15px] text-white/90">
          <li className="flex gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            {contatti.indirizzo}, {contatti.citta}
          </li>
          {contatti.orari.map((o) => (
            <li key={o.giorni} className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
              <span>
                <span className="font-semibold">{o.giorni}:</span> {o.orario}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <a href={contatti.mappaUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
            <Navigation className="h-4 w-4" /> Indicazioni stradali
          </a>
          <Link href="/chi-siamo" className="inline-flex h-11 items-center rounded-full border border-white/25 px-5 text-[15px] font-semibold text-white hover:bg-white/10">
            La nostra storia
          </Link>
        </div>
      </div>
    </section>
  );
}
