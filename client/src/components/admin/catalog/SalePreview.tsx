import { ArrowRight, Tag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { percentFromPrice, roundMoney } from "./utils";

/** Anteprima dal vivo: "da 12,50 € a 9,99 € (-20%)" */
export function SalePreview({
  fullPrice,
  salePrice,
  className,
  title = "Il cliente vedrà",
  emptyText = "Scrivi lo sconto per vedere subito il nuovo prezzo.",
}: {
  fullPrice: number | null;
  salePrice: number | null;
  className?: string;
  title?: string;
  emptyText?: string;
}) {
  const ready = fullPrice !== null && fullPrice > 0 && salePrice !== null && salePrice < fullPrice;
  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        ready ? "border-magenta/25 bg-magenta-soft" : "border-dashed border-paper-line bg-paper",
        className
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
        <Tag className="h-3.5 w-3.5" /> {title}
      </p>
      {ready ? (
        <>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] text-ink-soft">
            <span>da</span>
            <s className="font-semibold text-ink-muted">{formatPrice(fullPrice)}</s>
            <ArrowRight className="h-4 w-4 self-center text-ink-faint" aria-hidden />
            <span>a</span>
            <strong className="text-2xl font-extrabold tracking-tight text-magenta-ink">{formatPrice(salePrice)}</strong>
            <span className="rounded-full bg-magenta px-2 py-0.5 text-xs font-bold text-white">
              -{percentFromPrice(fullPrice, salePrice)}%
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Risparmio per il cliente: <strong className="text-ink">{formatPrice(roundMoney(fullPrice - salePrice))}</strong>
          </p>
        </>
      ) : (
        <p className="mt-1.5 text-sm text-ink-muted">{emptyText}</p>
      )}
    </div>
  );
}
