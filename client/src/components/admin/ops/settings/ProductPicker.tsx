"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Loader2, Package, Search, X } from "lucide-react";
import type { ListProduct, Product } from "@/lib/types";
import { api } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/urls";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Picked = { id: number; titolo: string; immagine: string | null; prezzoFinale?: number; available?: boolean; stock?: number; missing?: boolean };

function Thumb({ src, size = 48 }: { src: string | null | undefined; size?: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-xl border border-paper-line bg-white" style={{ width: size, height: size }}>
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-contain p-1" />
      ) : (
        <span className="flex h-full items-center justify-center text-ink-faint">
          <Package className="h-5 w-5" />
        </span>
      )}
    </span>
  );
}

/** Scelta di un prodotto del catalogo con ricerca (es. il prodotto omaggio) */
export function ProductPicker({
  value,
  onChange,
  label = "Prodotto",
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState<Picked | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ListProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // Dettagli del prodotto scelto
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    let alive = true;
    api<Product>(`/products/${value}`)
      .then((p) => alive && setSelected({ id: p.id, titolo: p.titolo, immagine: p.immagine, prezzoFinale: p.prezzoFinale, available: p.available, stock: p.stock }))
      .catch(() => alive && setSelected({ id: value, titolo: `Prodotto #${value}`, immagine: null, missing: true }));
    return () => {
      alive = false;
    };
  }, [value, selected?.id]);

  // Ricerca con attesa di 300 ms
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(() => {
      api<{ data: ListProduct[] }>("/products", { query: { q: term, limit: 8 } })
        .then((res) => {
          if (!alive) return;
          setResults(res.data);
          setActive(0);
        })
        .catch(() => alive && setResults([]))
        .finally(() => alive && setSearching(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q]);

  const choose = (p: ListProduct) => {
    setSelected({ id: p.id, titolo: p.titolo, immagine: p.immagine, prezzoFinale: p.prezzoFinale, available: p.available, stock: p.stock });
    onChange(p.id);
    setSearchOpen(false);
    setQ("");
    setResults([]);
  };

  const showSearch = searchOpen || !value;
  const soldOut = selected && !selected.missing && (selected.available === false || selected.stock === 0);

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>

      {value && !selected && (
        <div className="flex items-center gap-3 rounded-2xl border border-paper-line bg-white p-3 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Carico il prodotto…
        </div>
      )}
      {value && selected && (
        <div className="flex items-center gap-3 rounded-2xl border border-paper-line bg-white p-3">
          <Thumb src={selected.immagine} />
          <div className="min-w-0 flex-1">
            {selected.missing ? (
              <p className="font-semibold text-magenta-ink">Prodotto non trovato (forse eliminato)</p>
            ) : (
              <a
                href={productPath(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-sm font-semibold hover:text-brand-600"
              >
                {selected.titolo}
              </a>
            )}
            {selected.prezzoFinale !== undefined && (
              <p className="text-xs text-ink-muted">Valore {formatPrice(selected.prezzoFinale)} · in regalo al cliente</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            {!searchOpen && (
              <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
                Cambia
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Rimuovi il prodotto"
              onClick={() => {
                onChange(null);
                setSearchOpen(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {soldOut && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-ink">
          <AlertTriangle className="h-3.5 w-3.5" /> Il prodotto risulta esaurito o non disponibile: l&apos;omaggio non verrà aggiunto ai carrelli.
        </p>
      )}

      {showSearch && (
        <div className={cn("relative", !!value && "mt-3")}>
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-faint" />
          <input
            ref={input}
            id={id}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={`${id}-results`}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${id}-opt-${results[active].id}` : undefined}
            value={q}
            autoFocus={searchOpen}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                choose(results[active]);
              } else if (e.key === "Escape") {
                setQ("");
                if (value) setSearchOpen(false);
              }
            }}
            placeholder="Cerca un prodotto per nome o marca…"
            autoComplete="off"
            className="field pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {searching && <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-ink-muted" />}
          {q.trim().length >= 2 && !searching && (
            <ul
              id={`${id}-results`}
              role="listbox"
              className="mt-2 max-h-80 divide-y divide-paper-line overflow-y-auto rounded-2xl border border-paper-line bg-white shadow-card"
            >
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-ink-muted">Nessun prodotto trovato per «{q.trim()}».</li>
              ) : (
                results.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${id}-opt-${p.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(p)}
                    className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5", i === active && "bg-brand-50")}
                  >
                    <Thumb src={p.immagine} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold">{p.titolo}</span>
                      <span className="text-xs text-ink-muted">
                        {formatPrice(p.prezzoFinale)}
                        {(!p.available || p.stock === 0) && <span className="ml-1.5 font-semibold text-orange-ink">· esaurito</span>}
                      </span>
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
          {searchOpen && value && (
            <button type="button" onClick={() => setSearchOpen(false)} className="mt-2 text-sm font-semibold text-ink-muted hover:text-ink">
              Annulla
            </button>
          )}
        </div>
      )}
    </div>
  );
}
