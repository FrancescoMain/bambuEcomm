import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Accordion senza JavaScript (details/summary), accessibile da tastiera */
export function AccordionItem({
  title,
  children,
  defaultOpen,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={cn("group border-b border-paper-line", className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}
