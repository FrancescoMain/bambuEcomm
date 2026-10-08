"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ListProduct, Paginated } from "@/lib/types";
import { ProductThumb } from "../ProductThumb";

export type PickedProduct = { id: number; titolo: string };

/** Ricerca e scelta di più prodotti (es. per limitare un codice sconto) */
export function ProductPicker({
  value,
  onChange,
  label = "Prodotti",
}: {
  value: PickedProduct[];
  onChange: (value: PickedProduct[]) => void;
  label?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ListProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api<Paginated<ListProduct>>("/products", { query: { q: term, limit: 8, sort: "name_asc" } })
        .then((res) => alive && setResults(res.data))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [term]);

  const selected = new Set(value.map((p) => p.id));
  const toggle = (p: PickedProduct) =>
    onChange(selected.has(p.id) ? value.filter((v) => v.id !== p.id) : [...value, { id: p.id, titolo: p.titolo }]);

  return (
    <div>
      <p className="field-label">{label}</p>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Prodotti scelti">
          {value.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p)}
                className="inline-flex max-w-[260px] items-center gap-1 rounded-full bg-sky-soft py-1 pl-3 pr-2 text-sm font-semibold text-sky-ink hover:bg-sky-soft/70"
                aria-label={`Togli ${p.titolo}`}
              >
                <span className="truncate">{p.titolo}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="relative block">
        <span className="sr-only">Cerca un prodotto da aggiungere</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca un prodotto da aggiungere…"
          className="field py-2 pl-9 text-sm"
          autoComplete="off"
        />
        {loading && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />}
      </label>
      {term.length >= 2 && !loading && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-paper-line" role="listbox" aria-label="Risultati">
          {results.length === 0 && <li className="p-3 text-sm text-ink-muted">Nessun prodotto trovato.</li>}
          {results.map((p) => {
            const on = selected.has(p.id);
            return (
              <li key={p.id} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-paper",
                    on && "bg-sky-soft/60"
                  )}
                >
                  <ProductThumb src={p.immagine} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold">{p.titolo}</span>
                    <span className="text-xs text-ink-muted">{formatPrice(p.prezzoFinale)}</span>
                  </span>
                  {on ? <Check className="h-4 w-4 text-sky-ink" /> : <Plus className="h-4 w-4 text-ink-faint" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
