"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useRecentlyViewed } from "@/store/wishlist";
import { errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { Product, SelectedVariants } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/shop/CartLineRow";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ProductGallery } from "./ProductGallery";
import { NotifyMeForm } from "./NotifyMeForm";

/**
 * Parte interattiva della scheda prodotto: galleria + scelta varianti,
 * personalizzazione, quantità e "Aggiungi al carrello" (con barra fissa su mobile).
 * Titolo, prezzo e testi arrivano già renderizzati dal server tramite `header`/`footer`.
 */
export function ProductView({
  product,
  header,
  footer,
}: {
  product: Product;
  header: React.ReactNode;
  footer: React.ReactNode;
}) {
  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.openCart);
  const pushRecent = useRecentlyViewed((s) => s.push);
  const types = product.varianti.filter((t) => t.valori.length > 0);

  // Prima opzione di ogni tipo preselezionata (come prima del redesign)
  const [selected, setSelected] = useState<SelectedVariants>(() =>
    Object.fromEntries(
      types.map((t) => [String(t.id), { id: t.valori[0].id, nome: t.valori[0].nome.trim(), immagine: t.valori[0].immagine ?? null }])
    )
  );
  const [personalizzazione, setPersonalizzazione] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [showSticky, setShowSticky] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);

  useEffect(() => pushRecent(product.id), [product.id, pushRecent]);

  // Barra "Aggiungi" fissa quando il pulsante principale esce dallo schermo
  useEffect(() => {
    const el = buyRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const images = useMemo(() => {
    const variantImages = types.flatMap((t) => t.valori.map((v) => v.immagine).filter(Boolean)) as string[];
    return [...new Set([product.immagine, ...(product.immagini || []), ...variantImages].filter(Boolean) as string[])];
  }, [product, types]);

  const activeImage = Object.values(selected).find((v) => v.immagine)?.immagine ?? null;
  const maxQty = product.maxPerOrdine || 99;
  const variantLabel = types
    .map((t) => (selected[String(t.id)] ? `${t.nome.trim()}: ${selected[String(t.id)].nome}` : ""))
    .filter(Boolean)
    .join(", ");

  const addToCart = async () => {
    setState("loading");
    try {
      await add({
        productId: product.id,
        quantity,
        titolo: product.titolo,
        immagine: activeImage || product.immagine,
        prezzo: product.prezzoFinale,
        prezzoListino: product.prezzo,
        selectedVariants: types.length ? selected : null,
        personalizzazione: product.personalizzabile ? personalizzazione.trim() || null : null,
        variantLabel,
      });
      setState("done");
      openCart();
      setTimeout(() => setState("idle"), 1800);
    } catch (e) {
      setState("idle");
      toast.error(errorMessage(e));
    }
  };

  const badges = (
    <>
      {product.inOfferta && product.scontoPercentuale ? <Badge tone="sale">-{product.scontoPercentuale}%</Badge> : null}
      {!product.available && <Badge tone="soldout">Esaurito</Badge>}
    </>
  );

  const addLabel = state === "loading" ? "Aggiungo…" : state === "done" ? "Aggiunto!" : "Aggiungi al carrello";
  const AddIcon = state === "loading" ? Loader2 : state === "done" ? Check : ShoppingBag;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
      <div className="lg:sticky lg:top-36 lg:self-start">
        <ProductGallery images={images} alt={product.titolo} activeImage={activeImage} badges={badges} />
      </div>

      <div className="space-y-6">
        {header}

        {types.map((t) => (
          <fieldset key={t.id}>
            <legend className="mb-2.5 text-sm font-semibold text-ink-soft">
              {t.nome.trim()}: <span className="font-bold text-ink">{selected[String(t.id)]?.nome}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {t.valori.map((v) => {
                const active = selected[String(t.id)]?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [String(t.id)]: { id: v.id, nome: v.nome.trim(), immagine: v.immagine ?? null } }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-4 text-sm font-semibold transition",
                      !v.immagine && "pl-4",
                      active ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink-soft hover:border-ink-faint"
                    )}
                  >
                    {v.immagine && (
                      <span className="relative h-7 w-7 overflow-hidden rounded-full bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.immagine.replace("/upload/", "/upload/f_auto,q_auto,w_64/")} alt="" className="h-full w-full object-cover" />
                      </span>
                    )}
                    {v.nome.trim()}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        {product.personalizzabile && product.available && (
          <div>
            <label htmlFor="personalizzazione" className="field-label">
              {product.etichettaPersonalizzazione || "Personalizzazione"} <span className="font-normal text-ink-muted">(facoltativo)</span>
            </label>
            <input
              id="personalizzazione"
              value={personalizzazione}
              onChange={(e) => setPersonalizzazione(e.target.value.slice(0, 120))}
              placeholder="Es. Giulia"
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              {personalizzazione.length}/120 · I prodotti personalizzati non possono essere restituiti.
            </p>
          </div>
        )}

        <div ref={buyRef}>
          {product.available ? (
            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper value={quantity} onChange={(n) => setQuantity(Math.min(maxQty, Math.max(1, n)))} max={maxQty} />
              <button
                type="button"
                onClick={addToCart}
                disabled={state === "loading"}
                className="inline-flex h-12 min-w-[220px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-70"
              >
                <AddIcon className={cn("h-5 w-5", state === "loading" && "animate-spin")} />
                {addLabel}
              </button>
              <WishlistButton productId={product.id} withLabel className="hidden sm:inline-flex" />
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-paper-warm text-base font-bold text-ink-muted"
              >
                Esaurito
              </button>
              <NotifyMeForm productId={product.id} />
            </div>
          )}
          {product.maxPerOrdine && product.available && (
            <p className="mt-2 text-xs font-medium text-ink-muted">Massimo {product.maxPerOrdine} pezzi per ordine.</p>
          )}
          <WishlistButton productId={product.id} withLabel className="mt-3 w-full sm:hidden" />
        </div>

        {footer}
      </div>

      {/* Barra fissa su mobile */}
      {product.available && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-paper-line bg-white/95 p-3 backdrop-blur transition-transform duration-300 lg:hidden",
            showSticky ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex items-center gap-3 pr-16">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-muted">{product.titolo}</p>
              <p className={cn("text-lg font-extrabold", product.inOfferta && "text-magenta-ink")}>
                {formatPrice(product.prezzoFinale)}
              </p>
            </div>
            <button
              type="button"
              onClick={addToCart}
              disabled={state === "loading"}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-bold text-white"
            >
              <AddIcon className={cn("h-4 w-4", state === "loading" && "animate-spin")} />
              {state === "done" ? "Aggiunto" : "Aggiungi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
