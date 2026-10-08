"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";

const parse = (text: string) => {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Campo numerico con unità (€, giorni, secondi). Accetta la virgola
 * all'italiana ("4,99") e non salta mentre si scrive.
 */
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  decimals = 0,
  min = 0,
  max,
  placeholder,
  className,
  id,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  hint?: React.ReactNode;
  decimals?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const inputId = id || auto;
  const format = (n: number) => (decimals ? n.toFixed(decimals).replace(".", ",") : String(Math.round(n)));
  const clamp = (n: number) => {
    let v = decimals ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n);
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };
  const [text, setText] = useState(() => format(value ?? 0));

  // Allinea il testo quando il valore cambia dall'esterno (es. dopo il salvataggio)
  useEffect(() => {
    setText((current) => (parse(current) === value ? current : format(value ?? 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={className}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode={decimals ? "decimal" : "numeric"}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          onChange={(e) => {
            const next = e.target.value.replace(decimals ? /[^\d.,]/g : /[^\d]/g, "");
            setText(next);
            const n = parse(next);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          onBlur={() => {
            const n = parse(text);
            const next = Number.isNaN(n) ? value : clamp(n);
            setText(format(next));
            if (next !== value) onChange(next);
          }}
          className={cn("field", suffix && "pr-16")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
