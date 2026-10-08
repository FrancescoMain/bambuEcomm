"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagine" className="mt-6 flex items-center justify-between gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Precedente</span>
      </Button>
      <p className="text-sm text-ink-muted">
        Pagina <strong className="text-ink">{page}</strong> di {totalPages}
      </p>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <span className="hidden sm:inline">Successiva</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
