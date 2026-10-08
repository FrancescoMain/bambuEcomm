import { BadgePercent, CalendarClock, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DiscountTarget } from "./types";
import { discountInfo, formatShortDate } from "./utils";

/** Pulsante "Sconto" ben visibile: diventa "-20%" quando lo sconto è attivo */
export function DiscountButton({
  product,
  onClick,
  className,
  full,
}: {
  product: DiscountTarget;
  onClick: () => void;
  className?: string;
  full?: boolean;
}) {
  const info = discountInfo(product);
  const base =
    "inline-flex h-9 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-bold transition";
  if (info.state === "active") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, "bg-magenta text-white shadow-sm hover:bg-magenta-ink", full && "w-full", className)}
        aria-label={`Modifica sconto di ${product.titolo} (ora -${info.percent ?? ""}%)`}
        title="Modifica o togli lo sconto"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden /> Sconto
      </button>
    );
  }
  if (info.state === "scheduled") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          "border border-magenta/40 bg-magenta-soft text-magenta-ink hover:border-magenta",
          full && "w-full",
          className
        )}
        aria-label={`Modifica sconto programmato di ${product.titolo} (-${info.percent}% dal ${formatShortDate(info.start)})`}
        title="Sconto programmato: clicca per modificarlo"
      >
        <CalendarClock className="h-4 w-4" aria-hidden /> Programmato
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "border border-magenta/40 bg-white text-magenta-ink hover:border-magenta hover:bg-magenta-soft",
        full && "w-full",
        className
      )}
      aria-label={`Metti in sconto ${product.titolo}`}
    >
      <BadgePercent className="h-4 w-4" aria-hidden /> Sconto
    </button>
  );
}

/** Riga informativa sotto il prezzo (scadenza, partenza, sconto scaduto) */
export function DiscountNote({ product, className }: { product: DiscountTarget; className?: string }) {
  const info = discountInfo(product);
  let text: string | null = null;
  if (info.state === "active" && info.end) text = `Offerta fino al ${formatShortDate(info.end)}`;
  if (info.state === "scheduled") text = `-${info.percent}% dal ${formatShortDate(info.start)}`;
  if (info.state === "expired") text = `Offerta scaduta il ${formatShortDate(info.end)}`;
  if (!text) return null;
  return (
    <p
      className={cn(
        "mt-0.5 text-xs font-medium",
        info.state === "expired" ? "text-ink-faint" : "text-magenta-ink",
        className
      )}
    >
      {text}
    </p>
  );
}
