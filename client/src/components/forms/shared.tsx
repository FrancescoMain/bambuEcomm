"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CircleAlert, CircleCheckBig, Info } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { Checkbox } from "@/components/ui/Field";

// --- Validazione (stesse regole del server) ---

export const isEmail = (value: string) => {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
};

export const isPhone = (value: string) => /^\+?[\d\s./()-]{6,20}$/.test(value.trim());

export const MIN_MESSAGE = 10;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/**
 * Errori dei campi: `check` li mostra e porta il focus sul primo campo non
 * valido (nell'ordine della pagina). Restituisce true se il form è valido.
 */
export function useFieldErrors<K extends string>() {
  const [errors, setErrors] = useState<FieldErrors<K>>({});
  const clear = (key: K) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  const check = (next: FieldErrors<K>, form: HTMLFormElement | null) => {
    flushSync(() => setErrors(next));
    const invalid = Object.values(next).some(Boolean);
    if (invalid) form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    return !invalid;
  };
  return { errors, setErrors, clear, check };
}

/** Valore del campo trappola anti-bot (vedi <Honeypot />) */
export const honeypot = (form: HTMLFormElement) => (new FormData(form).get("website") as string) || undefined;

/** POST /contact (contatto, b2b, preventivo) */
export const sendContactForm = (body: Record<string, unknown>) =>
  api<{ message: string }>("/contact", { method: "POST", auth: false, body });

// --- Componenti ---

export function FormAlert({
  children,
  tone = "error",
  className,
}: {
  children: React.ReactNode;
  tone?: "error" | "info";
  className?: string;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-2xl p-4 text-sm leading-relaxed",
        tone === "error" ? "bg-magenta-soft text-magenta-ink" : "bg-sky-soft text-sky-ink",
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Messaggio di conferma che sostituisce il form (riceve il focus) */
export function FormSuccess({
  title,
  children,
  action,
  className,
  headingLevel = 2,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  headingLevel?: 1 | 2;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Heading = headingLevel === 1 ? "h1" : "h2";
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className={cn(
        "flex animate-pop-in flex-col items-center rounded-3xl bg-brand-50 px-6 py-12 text-center outline-none",
        className
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
        <CircleCheckBig className="h-8 w-8" aria-hidden />
      </span>
      <Heading className="mt-5 text-2xl font-extrabold">{title}</Heading>
      {children && <div className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-soft">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Consenso privacy obbligatorio per i form pubblici */
export function PrivacyConsent({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <Checkbox
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        aria-required
        label={
          children ?? (
            <>
              Ho letto l&apos;
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
              >
                informativa privacy
              </Link>{" "}
              e acconsento al trattamento dei miei dati per ricevere una
              risposta.<span className="text-magenta">&nbsp;*</span>
            </>
          )
        }
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 pl-7 text-xs text-magenta-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function RequiredNote() {
  return (
    <p className="text-xs text-ink-muted">
      I campi con <span className="text-magenta">*</span> sono obbligatori.
    </p>
  );
}
