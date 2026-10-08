"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart, cartCount } from "@/store/cart";
import { useUI } from "@/store/ui";
import { formatPrice } from "@/lib/format";
import { CartLineRow, FreeShippingBar } from "./CartLineRow";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const open = useUI((s) => s.cartOpen);
  const close = useUI((s) => s.closeCart);
  const lines = useCart((s) => s.lines);
  const quote = useCart((s) => s.quote);
  const refreshQuote = useCart((s) => s.refreshQuote);

  useEffect(() => {
    if (open) void refreshQuote();
  }, [open, refreshQuote]);

  const byKey = new Map((quote?.items || []).map((i) => [i.key, i]));
  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.prezzo * l.quantity, 0);
  const count = cartCount(lines);

  return (
    <Drawer
      open={open}
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          Il tuo carrello
          {count > 0 && (
            <span className="rounded-full bg-paper-warm px-2 py-0.5 text-sm font-bold text-ink-muted">{count}</span>
          )}
        </span>
      }
      footer={
        lines.length > 0 ? (
          <div className="space-y-3">
            {quote?.risparmio ? (
              <div className="flex justify-between text-sm font-semibold text-magenta-ink">
                <span>Risparmi</span>
                <span>-{formatPrice(quote.risparmio)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-ink-soft">Subtotale</span>
              <span className="text-xl font-extrabold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-ink-muted">IVA inclusa. Spedizione e sconti calcolati al checkout.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/carrello" onClick={close} className={buttonClass("outline", "md")}>
                Vedi carrello
              </Link>
              <Link href="/checkout" onClick={close} className={buttonClass("primary", "md")}>
                Vai alla cassa
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Il carrello è vuoto"
          text="Scopri le novità e le offerte della settimana."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/novita" onClick={close} className={buttonClass("primary", "md")}>
                Novità
              </Link>
              <Link href="/offerte" onClick={close} className={buttonClass("sale", "md")}>
                Offerte
              </Link>
            </div>
          }
        />
      ) : (
        <div className="px-5 pb-4 pt-4">
          <FreeShippingBar subtotal={subtotal} threshold={quote?.freeShippingThreshold ?? freeShippingThreshold} />
          {quote?.omaggio && (
            <p className="mt-3 rounded-2xl bg-orange-soft p-3 text-sm font-semibold text-orange-ink">
              🎁 In omaggio: {quote.omaggio.titolo}
            </p>
          )}
          <div className="divide-y divide-paper-line">
            {lines.map((line) => (
              <CartLineRow key={line.key} line={line} quoteLine={byKey.get(line.key)} compact onNavigate={close} />
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
