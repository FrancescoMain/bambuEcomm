"use client";

import { cn } from "@/lib/cn";

export type FilterTab<T extends string> = {
  value: T;
  label: string;
  /** Numero mostrato accanto all'etichetta */
  count?: number | null;
  /** Evidenzia il numero (es. ordini da preparare, messaggi da leggere) */
  highlight?: boolean;
  icon?: React.ReactNode;
};

/** Schede a pillola con contatori; su telefono scorrono in orizzontale */
export function FilterTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0", className)}
    >
      {items.map((tab) => {
        const active = tab.value === value;
        const alert = tab.highlight && !!tab.count;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
              active
                ? "border-ink bg-ink text-white shadow-sm"
                : "border-paper-line bg-white text-ink-soft hover:border-ink-faint hover:text-ink"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count !== null && (
              <span
                className={cn(
                  "min-w-[1.4rem] rounded-full px-1.5 py-1 text-center text-[11px] font-bold leading-none",
                  alert ? "bg-magenta text-white" : active ? "bg-white/20 text-white" : "bg-paper-warm text-ink-muted"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
