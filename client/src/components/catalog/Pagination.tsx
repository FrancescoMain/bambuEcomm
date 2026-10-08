import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Paginazione numerata con link veri (indicizzabili) */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const list = [...pages].sort((a, b) => a - b);
  const item = "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold transition";
  return (
    <nav aria-label="Pagine" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(item, "border border-paper-line bg-white hover:border-ink-faint")} aria-label="Pagina precedente">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 && <span className="px-1 text-ink-faint">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-ink text-white" : "border border-paper-line bg-white hover:border-ink-faint")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(item, "border border-paper-line bg-white hover:border-ink-faint")} aria-label="Pagina successiva">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
