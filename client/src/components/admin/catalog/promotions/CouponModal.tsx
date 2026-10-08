"use client";

import { useState } from "react";
import { Euro, Percent, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api, errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { FlatCategory } from "../categories";
import { CategoryChecklist } from "../CategoryChecklist";
import { DateRangeFields } from "../DateRangeFields";
import { AffixInput, useAutoFocus } from "../fields";
import { Segmented } from "../Segmented";
import { Switch } from "../Switch";
import type { Coupon } from "../types";
import {
  dateInputToIso,
  dateRangeError,
  formatShortDate,
  isOpenEnded,
  isoToDateInput,
  moneyInput,
  parseDecimal,
  parseIntSafe,
  todayInput,
} from "../utils";
import { couponValue, normalizeCode, randomCode } from "./couponUtils";
import { ProductPicker, type PickedProduct } from "./ProductPicker";

/** Creazione e modifica di un codice sconto (coupon da inserire nel carrello) */
export function CouponModal({
  coupon,
  open,
  categories,
  onClose,
  onSaved,
}: {
  coupon: Coupon | null;
  open: boolean;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={coupon ? "Modifica codice sconto" : "Nuovo codice sconto"} className="max-w-xl">
      {open && <CouponForm key={coupon?.id ?? "nuovo"} coupon={coupon} categories={categories} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

type Errors = Partial<Record<"codice" | "valore" | "minimo" | "max" | "date" | "restrict", string>>;

function CouponForm({
  coupon,
  categories,
  onClose,
  onSaved,
}: {
  coupon: Coupon | null;
  categories: FlatCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [codice, setCodice] = useState(coupon?.codice ?? "");
  const [nome, setNome] = useState(coupon && coupon.nome !== coupon.codice ? coupon.nome : "");
  const [tipo, setTipo] = useState<Coupon["tipo"]>(coupon?.tipo ?? "percentuale");
  const [valore, setValore] = useState(
    coupon ? (coupon.tipo === "importo" ? moneyInput(coupon.valore) : String(coupon.valore)) : ""
  );
  const [minimo, setMinimo] = useState(coupon?.minimoOrdine ? moneyInput(coupon.minimoOrdine) : "");
  const [max, setMax] = useState(coupon?.maxUtilizzi ? String(coupon.maxUtilizzi) : "");
  const [range, setRange] = useState({
    start: coupon ? isoToDateInput(coupon.inizio) : todayInput(),
    end: coupon && !isOpenEnded(coupon.fine) ? isoToDateInput(coupon.fine) : "",
  });
  const [attivo, setAttivo] = useState(coupon?.attivo ?? true);
  const [categorieIds, setCategorieIds] = useState<number[]>(coupon?.categorie.map((c) => c.id) ?? []);
  const [prodotti, setProdotti] = useState<PickedProduct[]>(coupon?.prodotti ?? []);
  const [restrict, setRestrict] = useState(!!(coupon?.categorie.length || coupon?.prodotti.length));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const codeInput = useAutoFocus<HTMLInputElement>(!coupon);

  const value = parseDecimal(valore);
  const minimoValue = parseDecimal(minimo);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!/^[A-Z0-9_-]{3,30}$/.test(codice)) e.codice = "Da 3 a 30 caratteri: lettere, numeri, - oppure _.";
    if (value === null || value <= 0) e.valore = "Inserisci un valore maggiore di zero.";
    else if (tipo === "percentuale" && value >= 100) e.valore = "La percentuale deve essere inferiore a 100.";
    if (minimo.trim() && (minimoValue === null || minimoValue < 0)) e.minimo = "Inserisci un importo valido.";
    if (max.trim() && !parseIntSafe(max)) e.max = "Inserisci un numero intero.";
    const dates = dateRangeError(range.start, range.end);
    if (dates) e.date = dates;
    if (restrict && !categorieIds.length && !prodotti.length) {
      e.restrict = "Scegli almeno una categoria o un prodotto, oppure spegni questa opzione.";
    }
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const keepStart = coupon && isoToDateInput(coupon.inizio) === range.start ? coupon.inizio : null;
      const keepEnd = coupon && !isOpenEnded(coupon.fine) && isoToDateInput(coupon.fine) === range.end ? coupon.fine : null;
      const body = {
        codice,
        nome: nome.trim() || codice,
        tipo,
        valore: value,
        minimoOrdine: minimoValue && minimoValue > 0 ? minimoValue : null,
        maxUtilizzi: parseIntSafe(max) || null,
        inizio: keepStart ?? (range.start ? dateInputToIso(range.start) : null),
        fine: keepEnd ?? (range.end ? dateInputToIso(range.end, true) : null),
        attivo,
        categorieIds: restrict ? categorieIds : [],
        prodottiIds: restrict ? prodotti.map((p) => p.id) : [],
      };
      if (coupon) await api(`/coupons/${coupon.id}`, { method: "PUT", body });
      else await api("/coupons", { method: "POST", body });
      toast.success(coupon ? "Codice sconto aggiornato." : `Codice ${codice} creato: i clienti possono già usarlo.`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, "Salvataggio non riuscito."));
    } finally {
      setSaving(false);
    }
  };

  // Riepilogo in parole semplici di cosa fa il codice
  const summary =
    value && value > 0 && codice
      ? [
          `Con il codice «${codice}» il cliente ottiene ${tipo === "percentuale" ? `il ${couponValue(tipo, value).slice(1)} di sconto` : `${formatPrice(value)} di sconto`}`,
          restrict && (categorieIds.length || prodotti.length) ? " sui prodotti scelti" : " sul carrello",
          minimoValue && minimoValue > 0 ? `, per ordini da almeno ${formatPrice(minimoValue)}` : "",
          range.end ? `, fino al ${formatShortDate(dateInputToIso(range.end, true) ?? range.end)}` : "",
          max && parseIntSafe(max) ? `, per ${parseIntSafe(max)} utilizzi in tutto` : "",
          ".",
        ].join("")
      : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <label htmlFor="codice-sconto" className="field-label">
          Codice da comunicare ai clienti<span className="text-magenta"> *</span>
        </label>
        <div className="flex gap-2">
          <input
            ref={codeInput}
            id="codice-sconto"
            value={codice}
            onChange={(e) => {
              setCodice(normalizeCode(e.target.value));
              setErrors((p) => ({ ...p, codice: undefined }));
            }}
            placeholder="Es. SCUOLA10"
            aria-invalid={!!errors.codice || undefined}
            aria-describedby="codice-sconto-desc"
            className={cn(
              "field font-mono text-base font-bold tracking-wider",
              errors.codice && "border-magenta focus:border-magenta focus:ring-magenta/15"
            )}
            autoComplete="off"
            maxLength={30}
          />
          <Button
            variant="outline"
            className="h-[46px] shrink-0 rounded-xl px-3.5"
            onClick={() => {
              setCodice(randomCode());
              setErrors((p) => ({ ...p, codice: undefined }));
            }}
            title="Genera un codice casuale"
          >
            <Shuffle className="h-4 w-4" /> <span className="hidden sm:inline">Genera</span>
            <span className="sr-only sm:hidden">Genera un codice casuale</span>
          </Button>
        </div>
        <p id="codice-sconto-desc" className={cn("mt-1.5 text-xs", errors.codice ? "text-magenta-ink" : "text-ink-muted")}>
          {errors.codice || "Lettere maiuscole e numeri, senza spazi. I clienti lo scrivono nel carrello."}
        </p>
      </div>

      <Input
        label="Nome interno (facoltativo)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Es. Promo rientro a scuola"
        hint="Lo vedi solo tu, per ricordare a cosa serve."
        maxLength={80}
      />

      <div>
        <p className="field-label">Tipo di sconto</p>
        <Segmented
          label="Tipo di sconto"
          value={tipo}
          onChange={(t) => {
            setTipo(t);
            setErrors((p) => ({ ...p, valore: undefined }));
          }}
          className="w-full"
          options={[
            { value: "percentuale", label: "Percentuale", icon: <Percent className="h-4 w-4" /> },
            { value: "importo", label: "Importo fisso", icon: <Euro className="h-4 w-4" /> },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AffixInput
          label="Sconto"
          required
          suffix={tipo === "percentuale" ? "%" : "€"}
          inputMode="decimal"
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          placeholder={tipo === "percentuale" ? "10" : "5,00"}
          error={errors.valore}
          autoComplete="off"
        />
        <AffixInput
          label="Spesa minima"
          suffix="€"
          inputMode="decimal"
          value={minimo}
          onChange={(e) => setMinimo(e.target.value)}
          placeholder="Nessuna"
          error={errors.minimo}
          autoComplete="off"
        />
        <Input
          label="Utilizzi massimi"
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Illimitati"
          error={errors.max}
          autoComplete="off"
        />
      </div>

      <DateRangeFields
        start={range.start}
        end={range.end}
        onChange={setRange}
        startLabel="Valido dal"
        endLabel="Fino al (compreso)"
        error={errors.date}
        hint="Lascia vuota la data di fine per un codice senza scadenza."
      />

      <div className="rounded-2xl border border-paper-line p-4">
        <Switch
          checked={restrict}
          onChange={setRestrict}
          label="Vale solo per alcuni prodotti"
          description={
            restrict
              ? "Lo sconto si applica solo ai prodotti e alle categorie scelti qui sotto."
              : "Spento: lo sconto vale su tutto il carrello."
          }
        />
        {restrict && (
          <div className="mt-4 space-y-4 border-t border-paper-line pt-4">
            <div>
              <p className="field-label">Categorie</p>
              <CategoryChecklist categories={categories} value={categorieIds} onChange={setCategorieIds} maxHeight="max-h-48" />
            </div>
            <ProductPicker value={prodotti} onChange={setProdotti} />
            {errors.restrict && <p className="text-xs text-magenta-ink">{errors.restrict}</p>}
          </div>
        )}
      </div>

      <Switch
        checked={attivo}
        onChange={setAttivo}
        label="Codice attivo"
        description="Spegnilo per sospenderlo senza eliminarlo."
      />

      {summary && (
        <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-800" aria-live="polite">
          {summary}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-paper-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Annulla
        </Button>
        <Button type="submit" loading={saving}>
          {coupon ? "Salva modifiche" : "Crea codice"}
        </Button>
      </div>
    </form>
  );
}
