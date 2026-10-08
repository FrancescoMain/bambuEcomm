"use client";

import { Lightbulb, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Spinner";

/** Suggerimento mostrato con ?sconto=1 (dal Riepilogo: "Applica uno sconto") */
export function DiscountTip({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-magenta/25 bg-magenta-soft p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-magenta-ink" />
      <div className="text-[15px] text-ink-soft">
        <p className="font-bold text-ink">Come mettere uno sconto</p>
        <p className="mt-0.5">
          Cerca il prodotto e premi <strong className="text-magenta-ink">Sconto</strong> sulla sua riga: scegli la
          percentuale o il prezzo finale e vedi subito il nuovo prezzo. Per scontare tanti prodotti insieme selezionali
          con la casella a sinistra, oppure usa <strong>Sconto su categoria</strong>.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="-mr-1 -mt-1 rounded-full p-2 text-ink-muted hover:bg-white"
        aria-label="Chiudi suggerimento"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="card divide-y divide-paper-line" aria-busy="true" aria-label="Caricamento prodotti">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-14 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
          <Skeleton className="hidden h-9 w-24 rounded-full md:block" />
        </div>
      ))}
    </div>
  );
}
