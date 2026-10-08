"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export const MIN_PASSWORD = 8;

const COMMON = ["password", "12345678", "123456789", "1234567890", "qwertyui", "qwerty123", "password1", "iloveyou"];

/** 0 = vuota, 1 = debole/corta, 2 = discreta, 3 = buona, 4 = ottima */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  if (pw.length < MIN_PASSWORD || COMMON.includes(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) return 1;
  const score =
    Number(pw.length >= 12) + Number(/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + Number(/\d/.test(pw)) + Number(/[^A-Za-z0-9]/.test(pw));
  return score >= 3 ? 4 : score === 2 ? 3 : score === 1 ? 2 : 1;
}

const LEVELS = [
  { label: "", bar: "" },
  { label: "Debole", bar: "bg-magenta" },
  { label: "Discreta", bar: "bg-orange" },
  { label: "Buona", bar: "bg-sky" },
  { label: "Ottima", bar: "bg-leaf" },
];

function StrengthMeter({ value }: { value: string }) {
  const level = passwordStrength(value);
  if (!level) return null;
  const tooShort = value.length < MIN_PASSWORD;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= level ? LEVELS[level].bar : "bg-paper-line")}
          />
        ))}
      </div>
      <p className="mt-1 text-xs font-semibold text-ink-soft">
        Sicurezza: {tooShort ? `troppo corta (${value.length}/${MIN_PASSWORD})` : LEVELS[level].label.toLowerCase()}
      </p>
    </div>
  );
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  /** mostra l'indicatore di sicurezza */
  meter?: boolean;
};

/** Campo password con pulsante mostra/nascondi (stile coerente con <Input />) */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { label, hint, error, className, id, meter, ...rest },
  ref
) {
  const auto = useId();
  const inputId = id || auto;
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={inputId} className="field-label">
        {label}
        {rest.required && <span className="text-magenta"> *</span>}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn("field pr-12", error && "border-magenta focus:border-magenta focus:ring-magenta/15")}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Nascondi password" : "Mostra password"}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-muted transition hover:text-ink"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {meter && <StrengthMeter value={String(rest.value ?? "")} />}
      {(error || hint) && (
        <p id={`${inputId}-desc`} className={cn("mt-1.5 text-xs", error ? "text-magenta-ink" : "text-ink-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
