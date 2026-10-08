"use client";

import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/** Coppia di date "Dal" / "Al" (entrambe facoltative) */
export function DateRangeFields({
  start,
  end,
  onChange,
  error,
  startLabel = "Dal",
  endLabel = "Al (compreso)",
  hint,
  className,
}: {
  start: string;
  end: string;
  onChange: (next: { start: string; end: string }) => void;
  error?: string | null;
  startLabel?: string;
  endLabel?: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label={startLabel}
          value={start}
          onChange={(e) => onChange({ start: e.target.value, end })}
        />
        <Input
          type="date"
          label={endLabel}
          value={end}
          min={start || undefined}
          onChange={(e) => onChange({ start, end: e.target.value })}
        />
      </div>
      {(error || hint) && (
        <p className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>{error || hint}</p>
      )}
    </div>
  );
}
