"use client";

import { Loader2 } from "lucide-react";
import type { CartQuote } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Riepilogo importi: subtotale, risparmio, sconto, consegna, commissioni, totale */
export function OrderTotals({ quote, loading, className }: { quote: CartQuote | null; loading?: boolean; className?: string }) {
  if (!quote) return null;
  const shippingLabel =
    quote.shippingMethod === "ritiro" ? "Ritiro in negozio" : quote.shippingMethod === "giornata" ? "Consegna in giornata" : "Spedizione";
  const row = "flex items-baseline justify-between gap-3";
  return (
    <dl className={cn("space-y-2.5 text-[15px]", loading && "opacity-60", className)}>
      <div className={row}>
        <dt className="text-ink-muted">Subtotale ({quote.itemCount} {quote.itemCount === 1 ? "articolo" : "articoli"})</dt>
        <dd className="font-semibold">{formatPrice(quote.subtotal)}</dd>
      </div>
      {quote.risparmio > 0 && (
        <div className={cn(row, "text-magenta-ink")}>
          <dt>Risparmi con le offerte</dt>
          <dd className="font-semibold">-{formatPrice(quote.risparmio)}</dd>
        </div>
      )}
      {quote.coupon && (
        <div className={cn(row, "text-magenta-ink")}>
          <dt>Codice {quote.coupon.code}</dt>
          <dd className="font-semibold">-{formatPrice(quote.coupon.discount)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-ink-muted">{shippingLabel}</dt>
        <dd className={cn("font-semibold", quote.shipping === 0 && "text-brand-700")}>
          {quote.shipping === 0 ? "Gratis" : formatPrice(quote.shipping)}
        </dd>
      </div>
      {quote.paymentFee > 0 && (
        <div className={row}>
          <dt className="text-ink-muted">Commissione contrassegno</dt>
          <dd className="font-semibold">{formatPrice(quote.paymentFee)}</dd>
        </div>
      )}
      <div className={cn(row, "border-t border-paper-line pt-3")}>
        <dt className="text-lg font-extrabold">Totale</dt>
        <dd className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />}
          {formatPrice(quote.total)}
        </dd>
      </div>
      <p className="text-xs text-ink-muted">IVA inclusa</p>
    </dl>
  );
}
