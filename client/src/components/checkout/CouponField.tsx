"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";

/** Campo "Hai un codice sconto?" collegato al ricalcolo del carrello */
export function CouponField() {
  const couponCode = useCart((s) => s.couponCode);
  const quote = useCart((s) => s.quote);
  const setCoupon = useCart((s) => s.setCoupon);
  const [open, setOpen] = useState(!!couponCode);
  const [value, setValue] = useState(couponCode || "");
  const [loading, setLoading] = useState(false);

  if (quote?.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-magenta-soft px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-magenta-ink">
          <Tag className="h-4 w-4" /> Codice <strong>{quote.coupon.code}</strong> applicato ({quote.coupon.label}, -
          {formatPrice(quote.coupon.discount)})
        </p>
        <button
          type="button"
          onClick={() => {
            setValue("");
            void setCoupon(null);
          }}
          className="rounded-full p-1 text-magenta-ink hover:bg-white/60"
          aria-label="Rimuovi codice sconto"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
        <Tag className="h-4 w-4" /> Hai un codice sconto?
      </button>
    );
  }

  // Niente <form>: il campo vive anche dentro il form del checkout (form annidati non sono validi)
  const apply = async () => {
    if (!value.trim()) return;
    setLoading(true);
    const res = await setCoupon(value);
    setLoading(false);
    if (res?.couponError) toast.error(res.couponError);
    else if (res?.coupon) toast.success("Codice sconto applicato!");
  };

  return (
    <div className="space-y-2">
      <label htmlFor="coupon" className="field-label">
        Codice sconto
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="ES. BENVENUTO10"
          className="field h-11 flex-1 uppercase"
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
        />
        <button type="button" onClick={() => void apply()} disabled={loading} className="h-11 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-ink-soft disabled:opacity-60">
          {loading ? "…" : "Applica"}
        </button>
      </div>
      {quote?.couponError && couponCode && <p className="text-xs font-semibold text-magenta-ink">{quote.couponError}</p>}
    </div>
  );
}
