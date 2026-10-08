import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} su 5 stelle`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? "fill-orange text-orange" : "fill-paper-line text-paper-line"}
        />
      ))}
    </span>
  );
}
