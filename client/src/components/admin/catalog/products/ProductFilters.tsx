"use client";

import { forwardRef, useState } from "react";
import { BadgePercent, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { indentLabel, type FlatCategory } from "../categories";
import { Segmented } from "../Segmented";
import { activeFilterCount, SORT_OPTIONS, type Availability, type ListFilters, type SortKey } from "./filters";

/** Barra di ricerca e filtri della lista prodotti */
export const ProductFilters = forwardRef<
  HTMLInputElement,
  {
    filters: ListFilters;
    search: string;
    onSearch: (value: string) => void;
    onChange: (patch: Partial<ListFilters>) => void;
    onReset: () => void;
    categories: FlatCategory[];
  }
>(function ProductFilters({ filters, search, onSearch, onChange, onReset, categories }, ref) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  const chip = (active: boolean, tone: "sale" | "brand") =>
    cn(
      "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition",
      active
        ? tone === "sale"
          ? "border-magenta bg-magenta text-white"
          : "border-orange bg-orange-soft text-orange-ink"
        : "border-paper-line bg-white text-ink-soft hover:border-ink-faint"
    );

  return (
    <div className="card mb-4 space-y-3 p-3 sm:p-4">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Cerca prodotti</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            ref={ref}
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cerca per nome, marca o codice…"
            className="field pl-10"
            autoComplete="off"
          />
        </label>
        <select
          aria-label="Ordina per"
          value={filters.ordine}
          onChange={(e) => onChange({ ordine: e.target.value as SortKey })}
          className="field hidden w-52 shrink-0 pr-9 md:block"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filtri-prodotti"
          className="relative inline-flex h-[46px] shrink-0 items-center gap-1.5 rounded-xl border border-paper-line bg-white px-3.5 text-sm font-semibold text-ink-soft md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtri
          {count > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      <div id="filtri-prodotti" className={cn("flex-wrap items-center gap-2", open ? "flex" : "hidden md:flex")}>
        <select
          aria-label="Ordina per"
          value={filters.ordine}
          onChange={(e) => onChange({ ordine: e.target.value as SortKey })}
          className="field w-full pr-9 md:hidden"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Ordina: {o.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Categoria"
          value={filters.categoria ?? ""}
          onChange={(e) => onChange({ categoria: e.target.value ? Number(e.target.value) : null })}
          className={cn("field w-full pr-9 md:w-60", !!filters.categoria && "border-brand-500 bg-brand-50/50")}
        >
          <option value="">Tutte le categorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {indentLabel(c)}
            </option>
          ))}
        </select>
        <Segmented<Availability>
          label="Disponibilità"
          size="sm"
          value={filters.disponibilita}
          onChange={(disponibilita) => onChange({ disponibilita })}
          className="w-full md:w-auto"
          options={[
            { value: "", label: "Tutti" },
            { value: "disponibili", label: "Disponibili" },
            { value: "esauriti", label: "Esauriti" },
          ]}
        />
        <button
          type="button"
          aria-pressed={filters.offerta}
          onClick={() => onChange({ offerta: !filters.offerta })}
          className={chip(filters.offerta, "sale")}
        >
          <BadgePercent className="h-4 w-4" /> Solo in offerta
        </button>
        <button
          type="button"
          aria-pressed={filters.evidenza}
          onClick={() => onChange({ evidenza: !filters.evidenza })}
          className={chip(filters.evidenza, "brand")}
        >
          <Star className={cn("h-4 w-4", filters.evidenza && "fill-orange text-orange")} /> Solo in evidenza
        </button>
        {(count > 0 || filters.q) && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-ink-muted hover:bg-paper-warm hover:text-ink"
          >
            <X className="h-4 w-4" /> Azzera filtri
          </button>
        )}
      </div>
    </div>
  );
});
