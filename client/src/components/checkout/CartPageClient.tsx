"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, ShoppingBag, Store, Truck } from "lucide-react";
import { useCart } from "@/store/cart";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { CartLineRow, FreeShippingBar } from "@/components/shop/CartLineRow";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { formatPrice } from "@/lib/format";
import { CouponField } from "./CouponField";
import { OrderTotals } from "./OrderSummary";

export function CartPageClient({ freeShippingThreshold, pickup }: { freeShippingThreshold: number; pickup: boolean }) {
  const [mounted, setMounted] = useState(false);
  const lines = useCart((s) => s.lines);
  const quote = useCart((s) => s.quote);
  const quoting = useCart((s) => s.quoting);
  const refreshQuote = useCart((s) => s.refreshQuote);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const setShipping = useCart((s) => s.setShipping);

  useEffect(() => {
    setMounted(true);
    void refreshQuote();
  }, [refreshQuote]);

  if (!mounted) {
    return (
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container py-12">
        <EmptyState
          className="card"
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Il tuo carrello è vuoto"
          text="Aggiungi qualcosa dal catalogo: novità e offerte ti aspettano."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/novita" className={buttonClass("primary")}>Scopri le novità</Link>
              <Link href="/offerte" className={buttonClass("sale")}>Vedi le offerte</Link>
            </div>
          }
        />
        <div className="mt-14">
          <RecentlyViewed title="Ti erano piaciuti" />
        </div>
      </div>
    );
  }

  const byKey = new Map((quote?.items || []).map((i) => [i.key, i]));
  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.prezzo * l.quantity, 0);
  const blocking = quote?.errors.length ? quote.errors : [];

  return (
    <div className="container pb-16 pt-6">
      <h1 className="mb-6 text-3xl font-extrabold sm:text-4xl">Il tuo carrello</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-label="Prodotti nel carrello" className="space-y-4">
          <FreeShippingBar subtotal={subtotal} threshold={quote?.freeShippingThreshold ?? freeShippingThreshold} />
          {quote?.omaggio ? (
            <p className="rounded-2xl bg-orange-soft p-3.5 text-sm font-semibold text-orange-ink">🎁 In omaggio con il tuo ordine: {quote.omaggio.titolo}</p>
          ) : quote?.remainingForGift ? (
            <p className="rounded-2xl bg-orange-soft p-3.5 text-sm font-semibold text-orange-ink">
              🎁 Aggiungi {formatPrice(quote.remainingForGift)} e ricevi un omaggio!
            </p>
          ) : null}
          <div className="card divide-y divide-paper-line px-5">
            {lines.map((line) => (
              <CartLineRow key={line.key} line={line} quoteLine={byKey.get(line.key)} />
            ))}
          </div>
          <Link href="/prodotti" className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
            ← Continua lo shopping
          </Link>
        </section>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card space-y-5 p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">Riepilogo</h2>

            {pickup && (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-semibold text-ink-soft">Come vuoi ricevere l&apos;ordine?</legend>
                {[
                  { value: "spedizione" as const, label: "Spedizione a casa", icon: Truck },
                  { value: "ritiro" as const, label: "Ritiro gratuito in negozio", icon: Store },
                ].map((o) => (
                  <label
                    key={o.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-sm font-semibold transition ${
                      shippingMethod === o.value ? "border-brand-600 bg-brand-50" : "border-paper-line hover:border-ink-faint"
                    }`}
                  >
                    <input
                      type="radio"
                      name="consegna"
                      className="form-radio h-4 w-4 text-brand-600"
                      checked={shippingMethod === o.value}
                      onChange={() => void setShipping(o.value)}
                    />
                    <o.icon className="h-4 w-4 text-ink-muted" />
                    {o.label}
                  </label>
                ))}
              </fieldset>
            )}

            <CouponField />
            <OrderTotals quote={quote} loading={quoting} />

            {blocking.length > 0 && (
              <ul className="space-y-1 rounded-xl bg-magenta-soft p-3 text-sm font-medium text-magenta-ink">
                {blocking.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}

            <Link
              href="/checkout"
              aria-disabled={blocking.length > 0}
              className={buttonClass("primary", "lg", `w-full ${blocking.length ? "pointer-events-none opacity-50" : ""}`)}
            >
              Procedi all&apos;acquisto <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
              <Lock className="h-3.5 w-3.5" /> Pagamento sicuro con Stripe
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
