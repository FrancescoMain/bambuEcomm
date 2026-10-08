"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FlatCategory } from "./categories";

/**
 * Scelta multipla delle categorie con l'albero indentato.
 * Con molte categorie compare una ricerca veloce.
 */
export function CategoryChecklist({
  categories,
  value,
  onChange,
  error,
  loading,
  className,
  maxHeight = "max-h-80",
}: {
  categories: FlatCategory[];
  value: number[];
  onChange: (ids: number[]) => void;
  error?: string | null;
  loading?: boolean;
  className?: string;
  maxHeight?: string;
}) {
  const [filter, setFilter] = useState("");
  const selected = useMemo(() => new Set(value), [value]);
  const term = filter.trim().toLowerCase();
  const visible = term ? categories.filter((c) => c.path.toLowerCase().includes(term)) : categories;
  const chosen = categories.filter((c) => selected.has(c.id));

  const toggle = (id: number, checked: boolean) => {
    onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 animate-pulse rounded-lg bg-paper-warm" style={{ width: `${40 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return <p className="text-sm text-ink-muted">Non ci sono ancora categorie: creale dalla pagina Categorie.</p>;
  }

  return (
    <div className={className}>
      {chosen.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Categorie scelte">
          {chosen.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => toggle(c.id, false)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                aria-label={`Togli ${c.path}`}
              >
                {c.path}
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {categories.length > 10 && (
        <label className="relative mb-2 block">
          <span className="sr-only">Cerca categoria</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cerca categoria…"
            className="field py-2 pl-9 text-sm"
          />
        </label>
      )}
      <div
        className={cn(
          "overflow-y-auto rounded-xl border p-2",
          maxHeight,
          error ? "border-magenta" : "border-paper-line"
        )}
        role="group"
        aria-label="Categorie"
      >
        {visible.length === 0 && <p className="p-2 text-sm text-ink-muted">Nessuna categoria trovata.</p>}
        {visible.map((c) => (
          <label
            key={c.id}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2 text-[15px] transition hover:bg-paper",
              selected.has(c.id) && "bg-brand-50/60"
            )}
            style={{ paddingLeft: term ? 8 : 8 + c.depth * 22 }}
          >
            <input
              type="checkbox"
              checked={selected.has(c.id)}
              onChange={(e) => toggle(c.id, e.target.checked)}
              className="form-checkbox h-[18px] w-[18px] shrink-0 rounded-md border-ink-faint/60 text-brand-600 focus:ring-brand-500/30"
            />
            <span className={cn("min-w-0 flex-1 truncate", c.depth === 0 && !term ? "font-semibold text-ink" : "text-ink-soft")}>
              {term ? c.path : c.name}
            </span>
            <span className="shrink-0 text-xs text-ink-faint">{c.node.productCount}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-magenta-ink">{error}</p>}
    </div>
  );
}
