"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import type { Facets } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { SORT_OPTIONS } from "./params";

type SubCategory = { id: number; name: string; slug: string; count: number };

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page"); // ogni cambio di filtro riparte da pagina 1
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

/** Contenuto dei filtri (barra laterale su desktop, pannello su mobile) */
function FilterPanel({
  facets,
  subcategories,
  showSaleToggle,
}: {
  facets: Facets;
  subcategories: SubCategory[];
  showSaleToggle: boolean;
}) {
  const { params, update } = useQueryUpdater();
  const brands = (params.get("brand") || "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");
  useEffect(() => {
    setMin(params.get("min") || "");
    setMax(params.get("max") || "");
  }, [params]);

  const toggleBrand = (name: string) => {
    const next = brands.includes(name) ? brands.filter((b) => b !== name) : [...brands, name];
    update({ brand: next.join(",") || null });
  };

  const heading = "mb-3 text-sm font-extrabold uppercase tracking-wider text-ink";
  return (
    <div className="space-y-7">
      {subcategories.length > 0 && (
        <section>
          <h3 className={heading}>Categorie</h3>
          <ul className="space-y-1">
            {subcategories.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/categoria/${s.slug}`}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[15px] text-ink-soft transition hover:bg-paper-warm hover:text-ink"
                >
                  {s.name}
                  <span className="text-xs text-ink-faint">{s.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className={heading}>Prezzo</h3>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <label className="flex-1 text-xs font-semibold text-ink-muted">
            Da €
            <input
              inputMode="decimal"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder={String(Math.floor(facets.minPrice))}
              className="field mt-1 h-10 px-3 py-1.5"
            />
          </label>
          <label className="flex-1 text-xs font-semibold text-ink-muted">
            A €
            <input
              inputMode="decimal"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder={String(Math.ceil(facets.maxPrice))}
              className="field mt-1 h-10 px-3 py-1.5"
            />
          </label>
          <Button type="submit" size="sm" variant="dark" className="h-10">
            Vai
          </Button>
        </form>
        {facets.maxPrice > 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Prezzi da {formatPrice(facets.minPrice)} a {formatPrice(facets.maxPrice)}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className={heading}>Disponibilità</h3>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-[15px] text-ink-soft">
          <span>Solo prodotti disponibili</span>
          <input
            type="checkbox"
            checked={params.get("disponibili") === "1"}
            onChange={(e) => update({ disponibili: e.target.checked ? "1" : null })}
            className="form-checkbox h-5 w-5 rounded-md border-paper-line text-brand-600"
          />
        </label>
        {showSaleToggle && (
          <label className="flex cursor-pointer items-center justify-between gap-3 text-[15px] text-ink-soft">
            <span>
              Solo in offerta {facets.onSaleCount > 0 && <span className="text-xs text-ink-faint">({facets.onSaleCount})</span>}
            </span>
            <input
              type="checkbox"
              checked={params.get("offerte") === "1"}
              onChange={(e) => update({ offerte: e.target.checked ? "1" : null })}
              className="form-checkbox h-5 w-5 rounded-md border-paper-line text-magenta"
            />
          </label>
        )}
      </section>

      {facets.brands.length > 0 && (
        <section>
          <h3 className={heading}>Marca</h3>
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <li key={b.name}>
                <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={brands.includes(b.name)}
                    onChange={() => toggleBrand(b.name)}
                    className="form-checkbox h-[18px] w-[18px] rounded-md border-paper-line text-brand-600"
                  />
                  <span className="flex-1">{b.name}</span>
                  <span className="text-xs text-ink-faint">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function CatalogSidebar(props: { facets: Facets; subcategories: SubCategory[]; showSaleToggle: boolean }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pb-8 pr-2">
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

/** Barra sopra la griglia: filtri (mobile), filtri attivi, ordinamento */
export function CatalogToolbar({
  total,
  facets,
  subcategories,
  showSaleToggle,
  defaultSort,
  allowRelevance,
}: {
  total: number;
  facets: Facets;
  subcategories: SubCategory[];
  showSaleToggle: boolean;
  defaultSort: string;
  allowRelevance?: boolean;
}) {
  const { params, update, pending } = useQueryUpdater();
  const [open, setOpen] = useState(false);
  const brands = (params.get("brand") || "").split(",").filter(Boolean);

  const chips: { label: string; clear: Record<string, string | null> }[] = [];
  brands.forEach((b) =>
    chips.push({ label: b, clear: { brand: brands.filter((x) => x !== b).join(",") || null } })
  );
  if (params.get("min") || params.get("max")) {
    chips.push({
      label: `${params.get("min") ? `da ${params.get("min")} €` : ""} ${params.get("max") ? `a ${params.get("max")} €` : ""}`.trim(),
      clear: { min: null, max: null },
    });
  }
  if (params.get("disponibili") === "1") chips.push({ label: "Disponibili", clear: { disponibili: null } });
  if (params.get("offerte") === "1") chips.push({ label: "In offerta", clear: { offerte: null } });

  const sortValue = params.get("sort") || defaultSort;
  const sortOptions = allowRelevance ? [{ value: "relevance", label: "Più pertinenti" }, ...SORT_OPTIONS] : SORT_OPTIONS;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-paper-line bg-white px-4 text-sm font-bold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtri
            {chips.length > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{chips.length}</span>
            )}
          </button>
          <p className={cn("text-sm text-ink-muted transition", pending && "opacity-50")} aria-live="polite">
            <span className="font-bold text-ink">{total}</span> {total === 1 ? "prodotto" : "prodotti"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="hidden sm:inline">Ordina per</span>
          <select
            value={sortValue}
            onChange={(e) => update({ sort: e.target.value === defaultSort ? null : e.target.value })}
            className="field h-11 w-auto py-0 pr-9 text-sm font-semibold"
            aria-label="Ordina per"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => update(c.clear)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-ink-soft"
            >
              {c.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => update({ brand: null, min: null, max: null, disponibili: null, offerte: null })}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            Azzera filtri
          </button>
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title="Filtri"
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Mostra {total} {total === 1 ? "prodotto" : "prodotti"}
          </Button>
        }
      >
        <div className="p-5">
          <FilterPanel facets={facets} subcategories={subcategories} showSaleToggle={showSaleToggle} />
        </div>
      </Drawer>
    </div>
  );
}
