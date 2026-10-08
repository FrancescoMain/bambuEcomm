"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { categoryPath, productPath } from "@/lib/urls";
import { cn } from "@/lib/cn";

type Suggestion = {
  products: {
    id: number;
    titolo: string;
    immagine: string | null;
    prezzo: number;
    prezzoFinale: number;
    inOfferta: boolean;
    available: boolean;
  }[];
  categories: { id: number; name: string; parentId: number | null }[];
};

const POPULAR = ["Zaini", "Astucci", "Quaderni", "Penne", "Diari", "Evidenziatori"];

/** Ricerca con suggerimenti istantanei (prodotti, categorie) e navigazione da tastiera */
export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestion | null>(null);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await api<Suggestion>("/products/suggest", {
          query: { q: term },
          auth: false,
          signal: ctrl.signal,
        });
        setData(res);
        setActive(-1);
      } catch {
        // richiesta annullata o errore di rete: nessun suggerimento
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: { href: string; label: string }[] = [
    ...(data?.products || []).map((p) => ({ href: productPath(p), label: p.titolo })),
    ...(data?.categories || []).map((c) => ({ href: categoryPath(c), label: c.name })),
  ];

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    const term = q.trim();
    if (term) go(`/prodotti?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && (q.trim().length >= 2 || q.length === 0);

  return (
    <div ref={box} className={cn("relative", className)}>
      <form role="search" onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cerca zaini, quaderni, penne…"
          aria-label="Cerca nel negozio"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-12 w-full rounded-full border border-paper-line bg-paper pl-11 pr-11 text-[15px] text-ink placeholder:text-ink-faint transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted" />
        ) : (
          q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:bg-paper-warm"
              aria-label="Cancella ricerca"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[70vh] animate-pop-in overflow-y-auto rounded-2xl border border-paper-line bg-white p-2 shadow-lift"
        >
          {q.trim().length < 2 ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Ricerche frequenti</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => go(`/prodotti?q=${encodeURIComponent(term)}`)}
                    className="rounded-full bg-paper-warm px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {data && data.products.length === 0 && data.categories.length === 0 && !loading && (
                <p className="p-4 text-sm text-ink-muted">Nessun risultato per “{q}”.</p>
              )}
              {data?.products.map((p, i) => (
                <Link
                  key={p.id}
                  href={productPath(p)}
                  role="option"
                  aria-selected={active === i}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2 transition",
                    active === i ? "bg-brand-50" : "hover:bg-paper"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper-warm">
                    {p.immagine && <Image src={p.immagine} alt="" fill sizes="48px" className="object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{p.titolo}</p>
                    <p className="text-sm">
                      <span className={p.inOfferta ? "font-bold text-magenta-ink" : "font-bold"}>
                        {formatPrice(p.prezzoFinale)}
                      </span>
                      {p.inOfferta && <s className="ml-2 text-xs text-ink-faint">{formatPrice(p.prezzo)}</s>}
                      {!p.available && <span className="ml-2 text-xs text-ink-muted">· Esaurito</span>}
                    </p>
                  </div>
                </Link>
              ))}
              {!!data?.categories.length && (
                <div className="mt-1 border-t border-paper-line px-2 pb-1 pt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Categorie</p>
                  <div className="flex flex-wrap gap-2">
                    {data.categories.map((c, i) => {
                      const idx = (data.products.length || 0) + i;
                      return (
                        <Link
                          key={c.id}
                          href={categoryPath(c)}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm font-semibold",
                            active === idx ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                          )}
                        >
                          {c.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => submit()}
                className="mt-1 w-full rounded-xl p-3 text-left text-sm font-bold text-brand-600 hover:bg-paper"
              >
                Vedi tutti i risultati per “{q.trim()}” →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
