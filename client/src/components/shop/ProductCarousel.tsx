"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CardProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/** Carosello orizzontale con scroll-snap (nessuna libreria, funziona col touch) */
export function ProductCarousel({ products }: { products: CardProduct[] }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  if (!products.length) return null;
  return (
    <div className="relative">
      <div ref={row} className="snap-row -mx-4 scroll-px-4 px-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="absolute -left-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full border border-paper-line bg-white shadow-card transition hover:shadow-lift lg:flex"
            aria-label="Precedenti"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="absolute -right-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full border border-paper-line bg-white shadow-card transition hover:shadow-lift lg:flex"
            aria-label="Successivi"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
