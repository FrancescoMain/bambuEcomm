"use client";

import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { DiscountButton, DiscountNote } from "../DiscountBits";
import { ProductThumb } from "../ProductThumb";
import { Switch } from "../Switch";
import type { AdminListProduct } from "../types";
import { CategoryNames, editHref, FeaturedToggle, ProductMeta, RowActions, SelectBox, type RowHandlers } from "./RowParts";

/** Tabella prodotti per schermi larghi */
export function ProductTable({
  products,
  selected,
  allSelected,
  someSelected,
  onSelectAll,
  handlers,
}: {
  products: AdminListProduct[];
  selected: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  handlers: (p: AdminListProduct) => RowHandlers;
}) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left">
        <thead className="border-b border-paper-line bg-paper/60 text-xs font-bold uppercase tracking-wide text-ink-muted">
          <tr>
            <th scope="col" className="w-12 py-3 pl-5 pr-2">
              <SelectBox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={onSelectAll}
                label="Seleziona tutti i prodotti della pagina"
              />
            </th>
            <th scope="col" className="px-3 py-3">Prodotto</th>
            <th scope="col" className="px-3 py-3">Categorie</th>
            <th scope="col" className="px-3 py-3">Prezzo</th>
            <th scope="col" className="px-3 py-3 text-center">Disponibile</th>
            <th scope="col" className="px-3 py-3 text-center">Evidenza</th>
            <th scope="col" className="py-3 pl-3 pr-5 text-right">
              <span className="sr-only">Azioni</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-line">
          {products.map((p) => {
            const h = handlers(p);
            const isSelected = selected.has(p.id);
            return (
              <tr key={p.id} className={cn("transition-colors", isSelected ? "bg-brand-50/60" : "hover:bg-paper/70")}>
                <td className="py-3 pl-5 pr-2 align-middle">
                  <SelectBox checked={isSelected} onChange={h.onSelect} label={`Seleziona ${p.titolo}`} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb src={p.immagine} size={52} dimmed={!p.available} />
                    <div className="min-w-0 max-w-[360px]">
                      <Link
                        href={editHref(p.id)}
                        className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:text-brand-700"
                      >
                        {p.titolo}
                      </Link>
                      <ProductMeta product={p} className="mt-0.5" />
                    </div>
                  </div>
                </td>
                <td className="max-w-[180px] px-3 py-3">
                  <CategoryNames product={p} className="line-clamp-2" />
                </td>
                <td className="px-3 py-3">
                  <Price
                    prezzo={p.prezzo}
                    prezzoFinale={p.prezzoFinale}
                    scontoPercentuale={p.scontoPercentuale}
                    size="sm"
                    showBadge
                  />
                  <DiscountNote product={p} />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={p.available}
                      onChange={h.onToggleAvailable}
                      loading={h.busy.available}
                      srLabel={`Disponibile: ${p.titolo}`}
                    />
                    <span className={cn("text-[11px] font-semibold", p.available ? "text-brand-700" : "text-ink-muted")}>
                      {p.available ? "In vendita" : "Esaurito"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <FeaturedToggle product={p} onToggle={h.onToggleFeatured} busy={h.busy.featured} />
                </td>
                <td className="py-3 pl-3 pr-5">
                  <div className="flex items-center justify-end gap-1">
                    <DiscountButton product={p} onClick={h.onDiscount} className="mr-1" />
                    <RowActions product={p} onDelete={h.onDelete} busy={h.busy.delete} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
