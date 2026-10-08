"use client";

import { useEffect, useId, useState } from "react";
import { Check, Eye, Save, Truck } from "lucide-react";
import type { Category, StoreSettings } from "@/lib/types";
import { api } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { SERVICE_ICONS } from "@/components/shop/icons";
import { cn } from "@/lib/cn";
import type { SaveState } from "./useSettingsForm";

/** Riquadro di una sezione delle impostazioni */
export function Block({
  icon,
  title,
  description,
  children,
  aside,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/** Barra "Salva" che resta visibile in basso mentre si modifica la sezione */
export function SaveBar({ form, label = "Salva" }: { form: SaveState; label?: string }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-paper-line bg-white/95 px-4 py-3 shadow-[0_-10px_30px_-20px_rgba(29,29,31,0.35)] backdrop-blur sm:bottom-4 sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
      {form.errors.length > 0 && (
        <ul role="alert" className="mb-3 space-y-1 rounded-xl bg-magenta-soft px-3.5 py-2.5 text-sm font-medium text-magenta-ink">
          {form.errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" aria-live="polite">
          {form.dirty ? (
            <span className="inline-flex items-center gap-2 text-orange-ink">
              <span className="h-2 w-2 rounded-full bg-orange" /> Modifiche non salvate
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <Check className="h-4 w-4 text-brand-600" /> Tutto salvato
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {form.dirty && (
            <Button variant="ghost" size="sm" onClick={form.reset} disabled={form.saving}>
              Annulla
            </Button>
          )}
          <Button size="sm" onClick={form.save} loading={form.saving} disabled={!form.dirty}>
            {!form.saving && <Save className="h-4 w-4" />}
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Riquadro "Anteprima": come lo vedrà il cliente */
export function Preview({ children, label = "Anteprima", className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-ink-faint/50 bg-paper p-3.5", className)}>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
        <Eye className="h-3.5 w-3.5" /> {label}
      </p>
      {children}
    </div>
  );
}

const euroShort = (n: number) => formatPrice(n).replace(",00", "");

/** Come il sito: {soglia} e {costo} diventano i valori reali della spedizione */
export const fillPlaceholders = (text: string, spedizione: StoreSettings["spedizione"]) =>
  text.replace(/\{(soglia|costo)\}/g, (_, key: string) =>
    euroShort(key === "soglia" ? spedizione.sogliaGratuita : spedizione.costo)
  );

export function PlaceholderHint({ spedizione }: { spedizione: StoreSettings["spedizione"] }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-sky-soft px-3 py-2 text-xs text-sky-ink">
      <Truck className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>
        Puoi scrivere <code className="rounded bg-white px-1 font-bold">{"{soglia}"}</code> e{" "}
        <code className="rounded bg-white px-1 font-bold">{"{costo}"}</code>: verranno sostituiti con la soglia di spedizione
        gratuita ({euroShort(spedizione.sogliaGratuita)}) e il costo di spedizione ({euroShort(spedizione.costo)}).
      </span>
    </p>
  );
}

// ------------------------------------------------------------- link interni

const STATIC_LINKS = [
  { value: "/offerte", label: "Offerte" },
  { value: "/novita", label: "Novità" },
  { value: "/prodotti", label: "Tutti i prodotti" },
  { value: "/blog", label: "Blog" },
];

let categoriesCache: Promise<{ value: string; label: string }[]> | null = null;
const loadCategoryLinks = () =>
  (categoriesCache ??= api<Category[]>("/categories", { auth: false })
    .then((list) => list.map((c) => ({ value: `/categoria/${c.slug}`, label: c.name })))
    .catch(() => []));

export const isValidLink = (v: string) => /^\/(?!\/)/.test(v) || /^https?:\/\/\S+\.\S+/.test(v);

/** Campo link con suggerimenti delle pagine del sito (categorie, offerte...) */
export function LinkInput({
  label,
  value,
  onChange,
  hint = "Es. /offerte, /categoria/scuola oppure un indirizzo https://…",
  required,
  placeholder = "/offerte",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const [options, setOptions] = useState(STATIC_LINKS);
  useEffect(() => {
    let alive = true;
    void loadCategoryLinks().then((cats) => alive && setOptions([...STATIC_LINKS, ...cats]));
    return () => {
      alive = false;
    };
  }, []);
  const invalid = !!value && !isValidLink(value.trim());

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-magenta"> *</span>}
      </label>
      <input
        id={id}
        list={`${id}-list`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-hint`}
        className={cn("field", invalid && "border-magenta")}
      />
      <datalist id={`${id}-list`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </datalist>
      <p id={`${id}-hint`} className={cn("mt-1.5 text-xs", invalid ? "text-magenta-ink" : "text-ink-muted")}>
        {invalid ? "Il link deve iniziare con / (pagina del sito) oppure con https://" : hint}
      </p>
    </div>
  );
}

// ------------------------------------------------------------- colori e icone

export const COLOR_OPTIONS = [
  { value: "green", label: "Verde", swatch: "bg-brand-500" },
  { value: "orange", label: "Arancio", swatch: "bg-orange" },
  { value: "magenta", label: "Magenta", swatch: "bg-magenta" },
  { value: "blue", label: "Azzurro", swatch: "bg-sky" },
] as const;

export function ColorPicker({ value, onChange, label = "Colore" }: { value: string | undefined; onChange: (value: string) => void; label?: string }) {
  const name = useId();
  const current = value || "green";
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((c) => {
          const active = current === c.value;
          return (
            <label
              key={c.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                active ? "border-ink text-ink shadow-sm" : "border-paper-line text-ink-soft hover:border-ink-faint"
              )}
            >
              <input type="radio" name={name} value={c.value} checked={active} onChange={() => onChange(c.value)} className="sr-only" />
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white", c.swatch)}>
                {active && <Check className="h-3.5 w-3.5" />}
              </span>
              {c.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "truck", label: "Spedizione" },
  { value: "store", label: "Negozio" },
  { value: "lock", label: "Sicurezza" },
  { value: "chat", label: "Assistenza" },
  { value: "briefcase", label: "Aziende" },
  { value: "gift", label: "Regalo" },
  { value: "return", label: "Reso" },
  { value: "percent", label: "Sconto" },
];

export function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="field-label">Icona</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {ICON_OPTIONS.map((opt) => {
          const Icon = SERVICE_ICONS[opt.value];
          const active = value === opt.value;
          return (
            <label
              key={opt.value}
              title={opt.label}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border bg-white px-1 py-2 text-[11px] font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-paper-line text-ink-muted hover:border-ink-faint hover:text-ink"
              )}
            >
              <input type="radio" name={name} value={opt.value} checked={active} onChange={() => onChange(opt.value)} className="sr-only" />
              {Icon && <Icon className="h-5 w-5" />}
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
