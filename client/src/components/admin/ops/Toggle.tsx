"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/** Interruttore acceso/spento con etichetta e spiegazione */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[15px] font-semibold text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span aria-hidden className={cn("text-xs font-bold", checked ? "text-brand-700" : "text-ink-faint")}>
          {checked ? "Attivo" : "Spento"}
        </span>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={description ? `${id}-desc` : undefined}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-brand-600" : "bg-ink-faint/40"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}
