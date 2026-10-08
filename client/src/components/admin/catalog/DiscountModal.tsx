"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, Euro, Percent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { DateRangeFields } from "./DateRangeFields";
import { AffixInput, PercentChips } from "./fields";
import { ProductThumb } from "./ProductThumb";
import { Segmented } from "./Segmented";
import { SalePreview } from "./SalePreview";
import type { DiscountTarget, ProductMutationResponse } from "./types";
import {
  computeSale,
  dateInputToIso,
  dateRangeError,
  discountInfo,
  formatShortDate,
  initialDiscountInput,
  isoToDateInput,
  isPastDate,
  type DiscountMode,
} from "./utils";

/**
 * Sconto rapido su un prodotto: percentuale o prezzo finale, anteprima dal
 * vivo del prezzo che vedrà il cliente e date facoltative.
 */
export function DiscountModal({
  product,
  onClose,
  onSaved,
}: {
  product: DiscountTarget | null;
  onClose: () => void;
  onSaved: (updated: DiscountTarget) => void;
}) {
  return (
    <Modal open={!!product} onClose={onClose} title="Sconto sul prodotto">
      {product && <DiscountForm key={product.id} product={product} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function DiscountForm({
  product,
  onClose,
  onSaved,
}: {
  product: DiscountTarget;
  onClose: () => void;
  onSaved: (updated: DiscountTarget) => void;
}) {
  const initial = initialDiscountInput(product.prezzo, product.prezzoScontato);
  const info = discountInfo(product);
  const keepDates = info.state === "active" || info.state === "scheduled";
  const [mode, setMode] = useState<DiscountMode>(initial.mode);
  const [value, setValue] = useState(initial.value);
  const [schedule, setSchedule] = useState(keepDates && !!(product.scontoInizio || product.scontoFine));
  const [range, setRange] = useState({
    start: keepDates ? isoToDateInput(product.scontoInizio) : "",
    end: keepDates ? isoToDateInput(product.scontoFine) : "",
  });
  const [saving, setSaving] = useState<"apply" | "remove" | null>(null);
  const [touched, setTouched] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [mode]);

  const sale = computeSale(product.prezzo, mode, value);
  const rangeError = schedule
    ? dateRangeError(range.start, range.end) ||
      (isPastDate(range.end) ? "La data di fine è già passata: l'offerta non partirebbe mai." : null)
    : null;
  const hasDiscount = product.prezzoScontato !== null;

  const switchMode = (next: DiscountMode) => {
    if (next === mode) return;
    // Converte il valore già inserito nell'altra modalità
    if (sale.salePrice !== null) {
      setValue(next === "price" ? sale.salePrice.toFixed(2).replace(".", ",") : String(sale.percent ?? ""));
    } else {
      setValue("");
    }
    setMode(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (sale.error || sale.salePrice === null || rangeError) {
      input.current?.focus();
      return;
    }
    setSaving("apply");
    try {
      const body: Record<string, unknown> =
        mode === "percent" ? { percent: sale.percent } : { price: sale.salePrice };
      if (schedule) {
        body.start = range.start ? dateInputToIso(range.start) : null;
        body.end = range.end ? dateInputToIso(range.end, true) : null;
      }
      const res = await api<ProductMutationResponse>(`/products/${product.id}/discount`, { method: "PATCH", body });
      revalidateStorefront(["products", `product:${product.id}`]);
      const updated = res.product;
      if (updated.inOfferta) {
        toast.success(`Sconto applicato: ora costa ${formatPrice(updated.prezzoFinale)} invece di ${formatPrice(updated.prezzo)}.`);
      } else if (updated.scontoInizio) {
        toast.success(`Sconto programmato: partirà il ${formatShortDate(updated.scontoInizio)}.`);
      } else {
        toast.success(res.message || "Sconto salvato.");
      }
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile applicare lo sconto."));
    } finally {
      setSaving(null);
    }
  };

  const remove = async () => {
    setSaving("remove");
    try {
      const res = await api<ProductMutationResponse>(`/products/${product.id}/discount`, {
        method: "PATCH",
        body: { remove: true },
      });
      revalidateStorefront(["products", `product:${product.id}`]);
      toast.success(`Sconto rimosso: torna a ${formatPrice(res.product.prezzo)}.`);
      onSaved(res.product);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile rimuovere lo sconto."));
    } finally {
      setSaving(null);
    }
  };

  const showError = touched || value.trim() !== "";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
        <ProductThumb src={product.immagine} size={52} />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.titolo}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Prezzo pieno <strong className="text-ink">{formatPrice(product.prezzo)}</strong>
          </p>
        </div>
      </div>

      <div>
        <p className="field-label">Come vuoi scontarlo?</p>
        <Segmented
          label="Tipo di sconto"
          value={mode}
          onChange={switchMode}
          className="w-full"
          options={[
            { value: "percent", label: "Percentuale", icon: <Percent className="h-4 w-4" /> },
            { value: "price", label: "Prezzo finale", icon: <Euro className="h-4 w-4" /> },
          ]}
        />
      </div>

      {mode === "percent" ? (
        <div className="space-y-3">
          <AffixInput
            ref={input}
            label="Sconto"
            suffix="%"
            inputMode="decimal"
            placeholder="Es. 20"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={showError ? sale.error : null}
            autoComplete="off"
          />
          <PercentChips value={value} onPick={setValue} />
        </div>
      ) : (
        <AffixInput
          ref={input}
          label="Nuovo prezzo per il cliente"
          suffix="€"
          inputMode="decimal"
          placeholder={`Meno di ${formatPrice(product.prezzo)}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={showError ? sale.error : null}
          autoComplete="off"
        />
      )}

      <SalePreview fullPrice={product.prezzo} salePrice={sale.salePrice} />

      <div className="space-y-3">
        <Checkbox
          checked={schedule}
          onChange={(e) => setSchedule(e.target.checked)}
          label={
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-ink-muted" /> Programma le date (facoltativo)
            </span>
          }
        />
        {schedule ? (
          <DateRangeFields
            start={range.start}
            end={range.end}
            onChange={setRange}
            error={rangeError}
            hint="L'offerta si attiva e si spegne da sola. Lascia vuoto un campo per non porre limiti."
          />
        ) : (
          <p className="pl-7 text-xs text-ink-muted">Senza date l&apos;offerta parte subito e resta finché non la togli.</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-paper-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {hasDiscount ? (
          <Button variant="ghost" onClick={remove} loading={saving === "remove"} disabled={!!saving} className="text-magenta-ink">
            <Trash2 className="h-4 w-4" /> Rimuovi sconto
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={!!saving}>
            Annulla
          </Button>
          <Button type="submit" variant="sale" loading={saving === "apply"} disabled={!!saving}>
            {hasDiscount ? "Salva sconto" : "Applica sconto"}
          </Button>
        </div>
      </div>
    </form>
  );
}
