import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

/** Prezzo con eventuale prezzo pieno barrato e percentuale di sconto */
export function Price({
  prezzo,
  prezzoFinale,
  scontoPercentuale,
  size = "md",
  showBadge = false,
  className,
}: {
  prezzo: number;
  prezzoFinale: number;
  scontoPercentuale?: number | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}) {
  const onSale = prezzoFinale < prezzo;
  const main = { sm: "text-[15px]", md: "text-lg", lg: "text-3xl" }[size];
  const old = { sm: "text-xs", md: "text-sm", lg: "text-lg" }[size];
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-extrabold tracking-tight", main, onSale ? "text-magenta-ink" : "text-ink")}>
        {formatPrice(prezzoFinale)}
      </span>
      {onSale && (
        <>
          <s className={cn("font-medium text-ink-faint", old)} aria-label={`Prezzo pieno ${formatPrice(prezzo)}`}>
            {formatPrice(prezzo)}
          </s>
          {showBadge && scontoPercentuale ? (
            <span className="rounded-full bg-magenta-soft px-2 py-0.5 text-xs font-bold text-magenta-ink">
              -{scontoPercentuale}%
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}
