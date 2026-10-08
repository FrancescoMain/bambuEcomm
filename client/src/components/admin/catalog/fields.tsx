"use client";

import { forwardRef, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";

type AffixInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  wrapperClassName?: string;
};

/**
 * Mette il cursore nel primo campo di una finestra. Il Modal all'apertura sposta
 * il fuoco sul pannello, quindi `autoFocus` non basta: aspettiamo un attimo.
 */
export function useAutoFocus<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => ref.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [enabled]);
  return ref;
}

/** Campo con simbolo dentro (es. "€" o "%"), errori e suggerimento sotto */
export const AffixInput = forwardRef<HTMLInputElement, AffixInputProps>(function AffixInput(
  { label, hint, error, prefix, suffix, wrapperClassName, className, id, required, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {required && <span className="text-magenta"> *</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn(
            "field",
            prefix ? "pl-9" : "",
            suffix ? "pr-10" : "",
            error && "border-magenta focus:border-magenta focus:ring-magenta/15",
            className
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
      {(error || hint) && (
        <p id={`${inputId}-desc`} className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

/** Scorciatoie per le percentuali più usate */
export function PercentChips({
  value,
  onPick,
  options = [10, 20, 30, 50],
}: {
  value: string;
  onPick: (value: string) => void;
  options?: number[];
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Percentuali rapide">
      {options.map((p) => {
        const active = value.trim() === String(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPick(String(p))}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-bold transition",
              active
                ? "border-magenta bg-magenta text-white"
                : "border-paper-line bg-white text-ink-soft hover:border-magenta hover:text-magenta-ink"
            )}
          >
            -{p}%
          </button>
        );
      })}
    </div>
  );
}

/** Riquadro di sezione dentro le pagine del pannello */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  id,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("card scroll-mt-20 p-5 sm:p-6 lg:scroll-mt-6", className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-lg font-bold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
