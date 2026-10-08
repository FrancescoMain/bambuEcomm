import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { TONE, type Tone } from "./tones";

export type Feature = { icon: LucideIcon; title: string; text: React.ReactNode; tone: Tone };

/** Griglia di vantaggi/valori con icona su sfondo colorato */
export function FeatureGrid({
  items,
  className,
  columns = 4,
}: {
  items: Feature[];
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  return (
    <ul
      className={cn(
        "grid gap-4 sm:grid-cols-2 sm:gap-5",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
        className
      )}
    >
      {items.map(({ icon: Icon, title, text, tone }) => (
        <li key={title} className={cn("rounded-3xl p-6", TONE[tone].soft)}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Icon className={cn("h-6 w-6", TONE[tone].icon)} aria-hidden />
          </span>
          <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{text}</p>
        </li>
      ))}
    </ul>
  );
}
