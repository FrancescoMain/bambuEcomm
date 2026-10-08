"use client";

import { useState } from "react";
import { BadgePercent, CalendarClock, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Checkbox, Select } from "@/components/ui/Field";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { indentLabel, subtreeProductCount, type FlatCategory } from "./categories";
import { DateRangeFields } from "./DateRangeFields";
import { AffixInput, PercentChips, useAutoFocus } from "./fields";
import { SalePreview } from "./SalePreview";
import { Segmented } from "./Segmented";
import { computeSale, dateInputToIso, dateRangeError, isPastDate, pluralize } from "./utils";

export type BulkDiscountTarget =
  | { kind: "products"; ids: number[] }
  | { kind: "category"; categoryId: number | null };

/** Sconto in percentuale su più prodotti insieme o su un'intera categoria */
export function BulkDiscountModal({
  target,
  categories = [],
  onClose,
  onDone,
}: {
  target: BulkDiscountTarget | null;
  categories?: FlatCategory[];
  onClose: () => void;
  onDone?: (updated: number) => void;
}) {
  const title = target?.kind === "products" ? "Sconto sui prodotti selezionati" : "Sconto su una categoria";
  return (
    <Modal open={!!target} onClose={onClose} title={title}>
      {target && (
        <BulkDiscountForm
          key={target.kind === "products" ? `p${target.ids.join(",")}` : `c${target.categoryId}`}
          target={target}
          categories={categories}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </Modal>
  );
}

function BulkDiscountForm({
  target,
  categories,
  onClose,
  onDone,
}: {
  target: BulkDiscountTarget;
  categories: FlatCategory[];
  onClose: () => void;
  onDone?: (updated: number) => void;
}) {
  const [action, setAction] = useState<"apply" | "remove">("apply");
  const [percent, setPercent] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(target.kind === "category" ? target.categoryId : null);
  const [schedule, setSchedule] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const needsCategory = target.kind === "category" && !target.categoryId;
  const percentInput = useAutoFocus<HTMLInputElement>(!needsCategory);
  const categorySelect = useAutoFocus<HTMLSelectElement>(needsCategory);

  const sale = computeSale(10, "percent", percent);
  const rangeError = schedule
    ? dateRangeError(range.start, range.end) || (isPastDate(range.end) ? "La data di fine è già passata." : null)
    : null;
  const category = categories.find((c) => c.id === categoryId) || null;
  const scope =
    target.kind === "products"
      ? pluralize(target.ids.length, "prodotto selezionato", "prodotti selezionati")
      : category
        ? `tutti i prodotti di «${category.name}»${category.node.children.length ? " e delle sue sottocategorie" : ""}`
        : "la categoria scelta";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (target.kind === "category" && !categoryId) return;
    if (action === "apply" && (sale.error || sale.percent === null || rangeError)) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> =
        target.kind === "products" ? { productIds: target.ids } : { categoryId };
      if (action === "remove") body.remove = true;
      else {
        body.percent = sale.percent;
        if (schedule) {
          body.start = range.start ? dateInputToIso(range.start) : null;
          body.end = range.end ? dateInputToIso(range.end, true) : null;
        }
      }
      const res = await api<{ message: string; updated: number }>("/products/bulk-discount", { method: "POST", body });
      revalidateStorefront(["products"]);
      const n = pluralize(res.updated, "prodotto", "prodotti");
      if (res.updated === 0) toast.info("Nessun prodotto da aggiornare in questa selezione.");
      else if (action === "remove") {
        toast.success(
          res.updated === 1 ? "Sconto tolto da 1 prodotto: torna al prezzo pieno." : `Sconti tolti da ${n}: tornano al prezzo pieno.`
        );
      }
      else toast.success(`Sconto del ${(sale.percent ?? 0).toLocaleString("it-IT")}% applicato a ${n}.`);
      onDone?.(res.updated);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile aggiornare gli sconti."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {target.kind === "category" && (
        <Select
          ref={categorySelect}
          label="Categoria"
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          error={touched && !categoryId ? "Scegli la categoria." : null}
          hint={
            category
              ? `Circa ${pluralize(subtreeProductCount(category.node), "prodotto", "prodotti")}, sottocategorie comprese.`
              : undefined
          }
        >
          <option value="">Scegli una categoria…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {indentLabel(c)}
            </option>
          ))}
        </Select>
      )}

      <Segmented
        label="Cosa vuoi fare"
        value={action}
        onChange={setAction}
        className="w-full"
        options={[
          { value: "apply", label: "Applica sconto", icon: <BadgePercent className="h-4 w-4" /> },
          { value: "remove", label: "Togli gli sconti", icon: <Eraser className="h-4 w-4" /> },
        ]}
      />

      {action === "apply" ? (
        <>
          <div className="space-y-3">
            <AffixInput
              ref={percentInput}
              label="Sconto su ogni prodotto"
              suffix="%"
              inputMode="decimal"
              placeholder="Es. 20"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              error={touched || percent ? (sale.error ?? (touched && !percent ? "Indica la percentuale di sconto." : null)) : null}
              autoComplete="off"
            />
            <PercentChips value={percent} onPick={setPercent} />
          </div>
          <SalePreview
            fullPrice={10}
            salePrice={sale.salePrice}
            title="Esempio su un articolo da 10,00 €"
            emptyText="Scrivi la percentuale per vedere un esempio."
          />
          <p className="text-sm text-ink-soft">
            Lo sconto verrà applicato a <strong>{scope}</strong>. Gli sconti già presenti su questi prodotti verranno
            sostituiti.
          </p>
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
            {schedule && (
              <DateRangeFields
                start={range.start}
                end={range.end}
                onChange={setRange}
                error={rangeError}
                hint="Perfetto per saldi e promozioni a tempo: l'offerta si attiva e si spegne da sola."
              />
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-paper p-4 text-[15px] text-ink-soft">
          Verranno tolti gli sconti da <strong>{scope}</strong>, compresi quelli programmati. I prodotti torneranno al
          prezzo pieno.
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-paper-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annulla
        </Button>
        <Button type="submit" variant={action === "remove" ? "danger" : "sale"} loading={saving}>
          {action === "remove" ? "Togli gli sconti" : "Applica sconto"}
        </Button>
      </div>
    </form>
  );
}
