"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Interruttore on/off accessibile (role="switch").
 * `label` visibile accanto, oppure `srLabel` solo per i lettori di schermo.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  srLabel,
  disabled,
  loading,
  tone = "brand",
  size = "md",
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  srLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  tone?: "brand" | "sale";
  size?: "sm" | "md";
  className?: string;
}) {
  const id = useId();
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  const button = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : srLabel}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        track,
        checked ? (tone === "sale" ? "bg-magenta" : "bg-brand-600") : "bg-ink-faint/40"
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200",
          thumb,
          checked ? shift : "translate-x-0"
        )}
      >
        {loading && <Spinner className="h-3 w-3 text-ink-muted" />}
      </span>
    </button>
  );

  if (!label) return <span className={className}>{button}</span>;
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
      {button}
    </div>
  );
}
