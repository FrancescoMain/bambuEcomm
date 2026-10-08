"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/store/cart";
import { errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/urls";
import { cn } from "@/lib/cn";
import type { QuoteLine } from "@/lib/types";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  size = "md",
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-11";
  return (
    <div className={cn("inline-flex items-center rounded-full border border-paper-line bg-white", h)}>
      <button
        type="button"
        className={cn("flex items-center justify-center rounded-full text-ink-soft hover:bg-paper-warm disabled:opacity-40", h, w)}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Diminuisci quantità"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={cn("flex items-center justify-center rounded-full text-ink-soft hover:bg-paper-warm disabled:opacity-40", h, w)}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Aumenta quantità"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Riga del carrello: usa i prezzi calcolati dal server (quote) quando disponibili */
export function CartLineRow({
  line,
  quoteLine,
  compact,
  onNavigate,
}: {
  line: CartLine;
  quoteLine?: QuoteLine;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const unit = quoteLine?.prezzoUnitario ?? line.prezzo;
  const listino = quoteLine?.prezzoListino ?? line.prezzoListino ?? unit;
  const label = quoteLine?.variantLabel || line.variantLabel;
  const href = productPath({ id: line.productId, titolo: line.titolo });

  const change = async (qty: number) => {
    try {
      await setQuantity(line.key, qty);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className={cn("flex gap-3", compact ? "py-3" : "py-5")}>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border border-paper-line bg-white",
          compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"
        )}
      >
        {line.immagine && <Image src={line.immagine} alt="" fill sizes="112px" className="object-contain p-1" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} onClick={onNavigate} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand-600">
            {line.titolo}
          </Link>
          <button
            type="button"
            onClick={() => remove(line.key).catch((e) => toast.error(errorMessage(e)))}
            className="-mr-1 shrink-0 rounded-full p-1.5 text-ink-faint transition hover:bg-magenta-soft hover:text-magenta-ink"
            aria-label={`Rimuovi ${line.titolo}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {label && <p className="mt-0.5 text-xs text-ink-muted">{label}</p>}
        {line.personalizzazione && (
          <p className="mt-0.5 text-xs text-ink-muted">
            Personalizzazione: <span className="font-semibold text-ink-soft">“{line.personalizzazione}”</span>
          </p>
        )}
        {quoteLine?.error && <p className="mt-1 text-xs font-semibold text-magenta-ink">{quoteLine.error}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={quoteLine?.maxPerOrdine || 99}
            onChange={change}
          />
          <div className="text-right">
            {listino > unit && <s className="block text-xs text-ink-faint">{formatPrice(listino * line.quantity)}</s>}
            <span className={cn("text-[15px] font-extrabold", listino > unit && "text-magenta-ink")}>
              {formatPrice(unit * line.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Barra "ti mancano X € per la spedizione gratuita" */
export function FreeShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (!threshold) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="rounded-2xl bg-brand-50 p-3.5">
      <p className="text-sm font-semibold text-brand-800">
        {remaining > 0 ? (
          <>
            Ti mancano <span className="font-extrabold">{formatPrice(remaining)}</span> per la spedizione gratuita
          </>
        ) : (
          <>🎉 Hai diritto alla spedizione gratuita!</>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
