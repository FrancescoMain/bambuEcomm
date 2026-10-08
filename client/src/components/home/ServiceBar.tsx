import type { StoreSettings } from "@/lib/types";
import { SERVICE_ICONS } from "@/components/shop/icons";
import { Truck } from "lucide-react";
import { withThreshold } from "@/lib/format";

const TINTS = ["text-orange bg-orange-soft", "text-magenta bg-magenta-soft", "text-brand-600 bg-brand-50", "text-sky bg-sky-soft"];

/** Barra dei vantaggi (spedizione, ritiro, pagamenti, assistenza...) */
export function ServiceBar({ servizi, soglia }: { servizi: StoreSettings["servizi"]; soglia: number }) {
  if (!servizi.length) return null;
  return (
    <section className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
      {servizi.map((s, i) => {
        const Icon = SERVICE_ICONS[s.icona] || Truck;
        return (
          <div key={s.titolo} className="flex w-[72%] shrink-0 snap-start items-center gap-3 rounded-2xl border border-paper-line bg-white p-4 sm:w-auto">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TINTS[i % TINTS.length]}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">{withThreshold(s.titolo, soglia)}</p>
              <p className="truncate text-xs text-ink-muted">{withThreshold(s.descrizione, soglia)}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
