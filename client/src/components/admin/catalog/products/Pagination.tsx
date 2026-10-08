"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Numeri di pagina compatti: 1 … 4 5 6 … 12 */
const pageList = (current: number, total: number): (number | "gap")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
};

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav aria-label="Pagine" className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-ink-muted">
        {totalPages <= 1 ? (
          <>
            <strong className="text-ink">{total.toLocaleString("it-IT")}</strong> {total === 1 ? "prodotto" : "prodotti"}
          </>
        ) : (
          <>
            {from.toLocaleString("it-IT")}–{to.toLocaleString("it-IT")} di{" "}
            <strong className="text-ink">{total.toLocaleString("it-IT")}</strong> prodotti
          </>
        )}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(btn, "border border-paper-line bg-white hover:border-ink-faint")}
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Pagina precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap${i}`} className="px-1 text-ink-faint" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Pagina ${p}`}
                className={cn(
                  btn,
                  "hidden sm:inline-flex",
                  p === page ? "bg-ink text-white" : "text-ink-soft hover:bg-paper-warm"
                )}
              >
                {p}
              </button>
            )
          )}
          <span className="px-2 text-sm font-semibold text-ink-soft sm:hidden">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className={cn(btn, "border border-paper-line bg-white hover:border-ink-faint")}
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Pagina successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
