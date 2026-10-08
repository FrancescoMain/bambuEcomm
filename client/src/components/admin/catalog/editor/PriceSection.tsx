"use client";

import { useEffect, useRef } from "react";
import { CalendarClock, Euro, Percent } from "lucide-react";
import { Checkbox } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { formatPrice } from "@/lib/format";
import { DateRangeFields } from "../DateRangeFields";
import { AffixInput, PercentChips, SectionCard } from "../fields";
import { Segmented } from "../Segmented";
import { Switch } from "../Switch";
import { dateInputToIso, formatShortDate, isPastDate, moneyInput, percentFromPrice, type DiscountMode } from "../utils";
import { formSale, type FormErrors, type ProductFormState } from "./formState";

type SetField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;

/** Prezzo di vendita e offerta: percentuale o prezzo finale, con date facoltative */
export function PriceSection({
  form,
  set,
  errors,
}: {
  form: ProductFormState;
  set: SetField;
  errors: FormErrors;
}) {
  const sale = formSale(form);
  const full = sale.full !== null && sale.full > 0 ? sale.full : null;
  const saleInput = useRef<HTMLInputElement>(null);
  const wasOn = useRef(form.saleOn);

  useEffect(() => {
    if (form.saleOn && !wasOn.current) saleInput.current?.focus();
    wasOn.current = form.saleOn;
  }, [form.saleOn]);

  const switchMode = (mode: DiscountMode) => {
    if (mode === form.saleMode) return;
    if (sale.salePrice !== null) {
      set("saleValue", mode === "price" ? moneyInput(sale.salePrice) : String(sale.percent ?? ""));
    } else {
      set("saleValue", "");
    }
    set("saleMode", mode);
  };

  // Stato dell'offerta rispetto alle date scelte
  const now = new Date();
  const startIso = form.saleSchedule && form.saleStart ? dateInputToIso(form.saleStart) : null;
  const endIso = form.saleSchedule && form.saleEnd ? dateInputToIso(form.saleEnd, true) : null;
  const notStarted = !!startIso && new Date(startIso) > now;
  const ended = !!endIso && new Date(endIso) < now;
  const activeNow = form.saleOn && sale.salePrice !== null && full !== null && !notStarted && !ended;
  const finalPrice = activeNow && sale.salePrice !== null ? sale.salePrice : (full ?? 0);

  let status: string;
  if (!form.saleOn) status = "Nessuna offerta: il cliente paga il prezzo pieno.";
  else if (sale.salePrice === null || full === null) status = "Completa lo sconto per vedere il prezzo finale.";
  else if (notStarted && startIso) {
    status = `L'offerta partirà da sola il ${formatShortDate(startIso)}${endIso ? ` e finirà il ${formatShortDate(endIso)}` : ""}.`;
  }
  else if (ended) status = "Le date dell'offerta sono già passate: il cliente vede il prezzo pieno.";
  else if (endIso) status = `Offerta attiva fino al ${formatShortDate(endIso)}, poi torna al prezzo pieno da sola.`;
  else status = "Offerta attiva da subito, finché non la spegni.";

  const counterpart =
    form.saleOn && full !== null && sale.salePrice !== null
      ? form.saleMode === "percent"
        ? `Prezzo scontato: ${formatPrice(sale.salePrice)}`
        : `Pari a uno sconto del ${percentFromPrice(full, sale.salePrice)}%`
      : null;

  return (
    <SectionCard id="sezione-prezzo" title="Prezzo e sconto" description="Il prezzo pieno e, se vuoi, un'offerta.">
      <AffixInput
        label="Prezzo di vendita"
        required
        suffix="€"
        inputMode="decimal"
        placeholder="Es. 12,50"
        value={form.prezzo}
        onChange={(e) => set("prezzo", e.target.value)}
        error={errors.prezzo}
        wrapperClassName="max-w-xs"
        autoComplete="off"
      />

      <div className="mt-5 rounded-2xl border border-paper-line p-4">
        <Switch
          tone="sale"
          checked={form.saleOn}
          onChange={(on) => set("saleOn", on)}
          label="Metti in offerta"
          description="Il prezzo pieno appare barrato e accanto compare lo sconto in percentuale."
        />

        {form.saleOn && (
          <div className="mt-4 space-y-4 border-t border-paper-line pt-4">
            <Segmented
              label="Tipo di sconto"
              value={form.saleMode}
              onChange={switchMode}
              className="w-full sm:w-auto"
              options={[
                { value: "percent", label: "Percentuale", icon: <Percent className="h-4 w-4" /> },
                { value: "price", label: "Prezzo finale", icon: <Euro className="h-4 w-4" /> },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
              <AffixInput
                ref={saleInput}
                label={form.saleMode === "percent" ? "Sconto" : "Prezzo in offerta"}
                suffix={form.saleMode === "percent" ? "%" : "€"}
                inputMode="decimal"
                placeholder={form.saleMode === "percent" ? "Es. 20" : full ? `Meno di ${formatPrice(full)}` : "Es. 9,90"}
                value={form.saleValue}
                onChange={(e) => set("saleValue", e.target.value)}
                error={errors.sale ?? (form.saleValue.trim() ? sale.error : null)}
                hint={counterpart ?? undefined}
                autoComplete="off"
              />
              {form.saleMode === "percent" && (
                <div className="sm:pt-8">
                  <PercentChips value={form.saleValue} onPick={(v) => set("saleValue", v)} />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Checkbox
                checked={form.saleSchedule}
                onChange={(e) => set("saleSchedule", e.target.checked)}
                label={
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                    <CalendarClock className="h-4 w-4 text-ink-muted" /> Programma le date (facoltativo)
                  </span>
                }
              />
              {form.saleSchedule && (
                <DateRangeFields
                  className="max-w-md"
                  start={form.saleStart}
                  end={form.saleEnd}
                  onChange={({ start, end }) => {
                    set("saleStart", start);
                    set("saleEnd", end);
                  }}
                  error={errors.saleDates}
                  hint={
                    isPastDate(form.saleEnd)
                      ? "Attenzione: la data di fine è già passata."
                      : "L'offerta si attiva e si spegne da sola. Lascia vuoto per non porre limiti."
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Il cliente vedrà</p>
          {full !== null ? (
            <Price
              prezzo={full}
              prezzoFinale={finalPrice}
              scontoPercentuale={activeNow ? percentFromPrice(full, finalPrice) : null}
              showBadge
              size="lg"
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-sm text-ink-muted">Inserisci il prezzo.</p>
          )}
        </div>
        <p className="max-w-xs text-sm text-ink-soft">{status}</p>
      </div>
    </SectionCard>
  );
}
