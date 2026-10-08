"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/cn";

export function WishlistButton({
  productId,
  className,
  withLabel,
}: {
  productId: number;
  className?: string;
  withLabel?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const active = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  useEffect(() => setMounted(true), []);
  const on = mounted && active;

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = await toggle(productId);
        toast(added ? "Aggiunto ai preferiti" : "Rimosso dai preferiti", { duration: 1800 });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition",
        withLabel
          ? "h-11 rounded-full border border-paper-line bg-white px-4 text-sm font-semibold hover:border-magenta hover:text-magenta-ink"
          : "h-9 w-9 rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur hover:text-magenta",
        on && "text-magenta",
        className
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", on && "fill-magenta text-magenta")} />
      {withLabel && (on ? "Nei preferiti" : "Aggiungi ai preferiti")}
    </button>
  );
}
