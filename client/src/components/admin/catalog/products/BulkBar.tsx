"use client";

import { BadgePercent, Eraser, Eye, EyeOff, Star, StarOff, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

export type BulkAction = "discount" | "removeDiscount" | "available" | "unavailable" | "feature" | "unfeature";

const ACTIONS: { id: BulkAction; label: string; icon: React.ComponentType<{ className?: string }>; sale?: boolean }[] = [
  { id: "discount", label: "Sconto %", icon: BadgePercent, sale: true },
  { id: "removeDiscount", label: "Rimuovi sconto", icon: Eraser },
  { id: "available", label: "Rendi disponibili", icon: Eye },
  { id: "unavailable", label: "Rendi non disponibili", icon: EyeOff },
  { id: "feature", label: "In evidenza", icon: Star },
  { id: "unfeature", label: "Togli evidenza", icon: StarOff },
];

/** Barra fissa in basso con le azioni sui prodotti selezionati */
export function BulkBar({
  count,
  busy,
  onAction,
  onClear,
}: {
  count: number;
  busy: BulkAction | null;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-5 lg:left-64">
      <div
        role="toolbar"
        aria-label="Azioni sui prodotti selezionati"
        className="pointer-events-auto mx-auto flex w-fit max-w-full animate-pop-in items-center gap-2 rounded-2xl bg-ink p-2 text-white shadow-lift"
      >
        <div className="flex shrink-0 items-center gap-1 pl-2">
          <span className="text-sm font-bold">{count}</span>
          <span className="hidden text-sm text-white/70 sm:inline">{count === 1 ? "selezionato" : "selezionati"}</span>
        </div>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAction(a.id)}
                disabled={busy !== null}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition disabled:opacity-50",
                  a.sale ? "bg-magenta text-white hover:bg-magenta-ink" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {busy === a.id ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                {a.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Annulla selezione"
          title="Annulla selezione"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
