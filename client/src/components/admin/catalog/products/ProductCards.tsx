"use client";

import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { DiscountButton, DiscountNote } from "../DiscountBits";
import { ProductThumb } from "../ProductThumb";
import { Switch } from "../Switch";
import type { AdminListProduct } from "../types";
import { CategoryNames, editHref, FeaturedToggle, ProductMeta, RowActions, SelectBox, type RowHandlers } from "./RowParts";

/** Prodotti come schede (telefono e tablet) */
export function ProductCards({
  products,
  selected,
  handlers,
}: {
  products: AdminListProduct[];
  selected: Set<number>;
  handlers: (p: AdminListProduct) => RowHandlers;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {products.map((p) => {
        const h = handlers(p);
        const isSelected = selected.has(p.id);
        return (
          <li
            key={p.id}
            className={cn(
              "card flex flex-col p-3 transition-colors sm:p-3.5",
              isSelected && "border-brand-300 bg-brand-50/50"
            )}
          >
            <div className="flex gap-3">
              <div className="pt-1">
                <SelectBox checked={isSelected} onChange={h.onSelect} label={`Seleziona ${p.titolo}`} />
              </div>
              <Link href={editHref(p.id)} tabIndex={-1} aria-hidden className="shrink-0">
                <ProductThumb src={p.immagine} size={64} dimmed={!p.available} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={editHref(p.id)} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:text-brand-700">
                  {p.titolo}
                </Link>
                <ProductMeta product={p} className="mt-0.5" />
                <CategoryNames product={p} className="mt-0.5 block truncate text-xs" />
                <div className="mt-1.5">
                  <Price
                    prezzo={p.prezzo}
                    prezzoFinale={p.prezzoFinale}
                    scontoPercentuale={p.scontoPercentuale}
                    size="sm"
                    showBadge
                  />
                  <DiscountNote product={p} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-paper-line pt-3">
              <div className="flex items-center gap-1.5">
                <Switch
                  size="sm"
                  checked={p.available}
                  onChange={h.onToggleAvailable}
                  loading={h.busy.available}
                  srLabel={`Disponibile: ${p.titolo}`}
                />
                <span className={cn("text-xs font-semibold", p.available ? "text-brand-700" : "text-ink-muted")}>
                  {p.available ? "In vendita" : "Esaurito"}
                </span>
                <FeaturedToggle product={p} onToggle={h.onToggleFeatured} busy={h.busy.featured} />
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                <DiscountButton product={p} onClick={h.onDiscount} className="h-9 px-3" />
                <RowActions product={p} onDelete={h.onDelete} busy={h.busy.delete} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
