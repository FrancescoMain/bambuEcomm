"use client";

import { useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Elenco di valori brevi mostrati come "etichette" (es. CAP serviti).
 * Si aggiungono con Invio, virgola o spazio; se ne possono incollare più insieme.
 */
export function ChipsInput({
  label,
  values,
  onChange,
  validate,
  placeholder,
  hint,
  inputMode,
  maxLength,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Restituisce true se il valore è accettabile */
  validate?: (value: string) => boolean;
  placeholder?: string;
  hint?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState<string[]>([]);

  const add = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    const bad: string[] = [];
    for (const part of parts) {
      if (validate && !validate(part)) bad.push(part);
      else if (!next.includes(part)) next.push(part);
    }
    if (next.length !== values.length) onChange(next);
    setInvalid(bad);
    setText(bad.join(" "));
  };

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div
        className="field flex min-h-[46px] cursor-text flex-wrap items-center gap-1.5 py-2 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
        onClick={() => input.current?.focus()}
      >
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1 text-sm font-semibold text-brand-700"
          >
            {value}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(values.filter((v) => v !== value));
              }}
              className="rounded-full p-0.5 transition hover:bg-brand-100"
              aria-label={`Rimuovi ${value}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={input}
          id={id}
          value={text}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={values.length ? "" : placeholder}
          aria-describedby={`${id}-hint`}
          aria-invalid={invalid.length > 0 || undefined}
          onChange={(e) => {
            setText(e.target.value);
            if (invalid.length) setInvalid([]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === " ") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (/[\s,;]/.test(pasted)) {
              e.preventDefault();
              add(`${text} ${pasted}`);
            }
          }}
          onBlur={() => text.trim() && add(text)}
          className="min-w-[7ch] flex-1 border-0 bg-transparent p-0 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-0 focus-visible:ring-0"
        />
        {text.trim() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              add(text);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Aggiungi
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className={invalid.length ? "mt-1.5 text-xs text-magenta-ink" : "mt-1.5 text-xs text-ink-muted"}>
        {invalid.length ? `Valore non valido: ${invalid.join(", ")}` : hint}
      </p>
    </div>
  );
}
