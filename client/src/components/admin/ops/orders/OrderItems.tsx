import Image from "next/image";
import { Package, PenLine } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatPrice, toNumber } from "@/lib/format";
import { productPath } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { deliveryOf, itemCount, itemTitle, orderTotals, variantLabels } from "./orderUtils";

function Row({ label, value, strong, className }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "border-t border-paper-line pt-2.5 text-base", className)}>
      <dt className={strong ? "font-bold text-ink" : "text-ink-soft"}>{label}</dt>
      <dd className={strong ? "text-lg font-extrabold text-ink" : "font-semibold text-ink"}>{value}</dd>
    </div>
  );
}

/** Articoli dell'ordine con varianti, personalizzazioni e riepilogo importi */
export function OrderItems({ order, typeNames }: { order: Order; typeNames: Record<string, string> }) {
  const totals = orderTotals(order);
  const method = deliveryOf(order);
  const legacy = order.subtotale === null && order.costoSpedizione === null && Math.abs(totals.total - totals.subtotal) > 0.009;

  return (
    <section aria-labelledby="order-items-title">
      <h3 id="order-items-title" className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
        Articoli ({itemCount(order)})
      </h3>
      <ul className="divide-y divide-paper-line overflow-hidden rounded-2xl border border-paper-line bg-white">
        {order.orderItems.map((item) => {
          const unit = toNumber(item.priceAtPurchase);
          const list = toNumber(item.prezzoListino);
          const variants = variantLabels(item, typeNames);
          const title = itemTitle(item);
          return (
            <li key={item.id} className="flex gap-3 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-paper-line bg-white">
                {item.product?.immagine ? (
                  <Image src={item.product.immagine} alt="" fill sizes="64px" className="object-contain p-1" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-faint">
                    <Package className="h-6 w-6" />
                  </span>
                )}
                {item.quantity > 1 && (
                  <span className="absolute right-0.5 top-0.5 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    ×{item.quantity}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={productPath({ id: item.productId, titolo: item.product?.titolo || title })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-600"
                >
                  {title}
                </a>
                {variants.length > 0 && <p className="mt-0.5 text-xs font-medium text-ink-soft">{variants.join(" · ")}</p>}
                {item.personalizzazione && (
                  <p className="mt-1.5 inline-flex items-start gap-1.5 rounded-lg bg-magenta-soft px-2 py-1 text-xs font-semibold text-magenta-ink">
                    <PenLine className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span>
                      Personalizzazione: «<span className="break-all">{item.personalizzazione}</span>»
                    </span>
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold">{formatPrice(unit)}</span>
                  {list > unit && (
                    <s className="text-xs text-ink-faint" aria-label={`Prezzo di listino ${formatPrice(list)}`}>
                      {formatPrice(list)}
                    </s>
                  )}
                  <span className="text-ink-muted">× {item.quantity}</span>
                </div>
              </div>
              <p className="shrink-0 text-sm font-bold">{formatPrice(unit * item.quantity)}</p>
            </li>
          );
        })}
      </ul>

      <dl className="mt-3 space-y-1.5 rounded-2xl bg-paper-warm/70 p-4 text-sm">
        <Row label="Subtotale" value={formatPrice(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row
            label={
              <>
                Sconto
                {order.codiceCoupon && (
                  <span className="ml-1.5 rounded-md bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-magenta-ink">
                    {order.codiceCoupon}
                  </span>
                )}
              </>
            }
            value={<span className="text-magenta-ink">− {formatPrice(totals.discount)}</span>}
          />
        )}
        {totals.shipping !== null && (
          <Row
            label={method === "ritiro" ? "Ritiro in negozio" : method === "giornata" ? "Consegna in giornata" : "Spedizione"}
            value={totals.shipping === 0 ? "Gratis" : formatPrice(totals.shipping)}
          />
        )}
        {totals.fee > 0 && <Row label="Commissione contrassegno" value={formatPrice(totals.fee)} />}
        <Row label="Totale" value={formatPrice(totals.total)} strong />
        {legacy && (
          <p className="pt-1 text-xs text-ink-muted">
            Ordine fatto con la versione precedente del sito: il dettaglio di spedizione e sconti non è disponibile.
          </p>
        )}
      </dl>
    </section>
  );
}
