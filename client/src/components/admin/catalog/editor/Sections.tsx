"use client";

import Image from "next/image";
import { ImageOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { SectionCard } from "../fields";
import { Switch } from "../Switch";
import { dateInputToIso, isValidImageSrc, percentFromPrice } from "../utils";
import { formSale, type FormErrors, type ProductFormState } from "./formState";

type SetField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;

export function InfoSection({
  form,
  set,
  errors,
  brands,
}: {
  form: ProductFormState;
  set: SetField;
  errors: FormErrors;
  brands: string[];
}) {
  return (
    <SectionCard id="sezione-info" title="Informazioni" description="Come il prodotto appare nel negozio e nelle ricerche.">
      <div className="space-y-4">
        <Input
          label="Nome del prodotto"
          required
          value={form.titolo}
          onChange={(e) => set("titolo", e.target.value)}
          error={errors.titolo}
          placeholder="Es. Quaderno A4 a righe Pigna Monocromo"
          maxLength={200}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Marca"
              list="marche-prodotti"
              value={form.marca}
              onChange={(e) => set("marca", e.target.value)}
              placeholder="Es. Pigna"
              hint="Scegli dall'elenco o scrivine una nuova."
              autoComplete="off"
            />
            <datalist id="marche-prodotti">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <Input
            label="Codice articolo / EAN"
            value={form.codice}
            onChange={(e) => set("codice", e.target.value)}
            placeholder="Es. 8006363012345"
            hint="Facoltativo: utile per cercarlo velocemente."
            autoComplete="off"
          />
        </div>
        <Textarea
          label="Descrizione"
          rows={7}
          value={form.descrizione}
          onChange={(e) => set("descrizione", e.target.value)}
          placeholder="Materiali, misure, colori, per che età è adatto…"
          hint="Vai a capo per separare i paragrafi."
        />
      </div>
    </SectionCard>
  );
}

export function VisibilitySection({ form, set }: { form: ProductFormState; set: SetField }) {
  return (
    <SectionCard id="sezione-visibilita" title="Visibilità">
      <div className="space-y-5">
        <Switch
          checked={form.available}
          onChange={(v) => set("available", v)}
          label="Disponibile"
          description={
            form.available
              ? "I clienti possono acquistarlo."
              : "Esaurito: resta visibile ma non si può acquistare. Chi chiede l'avviso riceverà un'email quando lo riattivi."
          }
        />
        <Switch
          checked={form.inEvidenza}
          onChange={(v) => set("inEvidenza", v)}
          label={
            <span className="inline-flex items-center gap-1.5">
              In evidenza nella home <Star className={cn("h-4 w-4", form.inEvidenza ? "fill-orange text-orange" : "text-ink-faint")} />
            </span>
          }
          description="Compare tra i prodotti consigliati in prima pagina."
        />
      </div>
    </SectionCard>
  );
}

export function OptionsSection({
  form,
  set,
  errors,
}: {
  form: ProductFormState;
  set: SetField;
  errors: FormErrors;
}) {
  return (
    <SectionCard id="sezione-opzioni" title="Opzioni">
      <div className="space-y-5">
        <div>
          <Switch
            checked={form.personalizzabile}
            onChange={(v) => set("personalizzabile", v)}
            label="Personalizzabile"
            description="Il cliente può scrivere un testo, ad esempio il nome da stampare."
          />
          {form.personalizzabile && (
            <Input
              className="mt-3"
              label="Cosa deve scrivere il cliente?"
              value={form.etichettaPersonalizzazione}
              onChange={(e) => set("etichettaPersonalizzazione", e.target.value)}
              placeholder="Es. Nome da stampare"
              maxLength={80}
              error={errors.etichetta}
              hint="È il titolo del campo che il cliente vede nella scheda prodotto."
            />
          )}
        </div>
        <Input
          label="Quantità massima per ordine"
          inputMode="numeric"
          value={form.maxPerOrdine}
          onChange={(e) => set("maxPerOrdine", e.target.value)}
          placeholder="Nessun limite"
          error={errors.maxPerOrdine}
          hint="Utile per articoli in offerta o pezzi limitati."
        />
        <Input
          label="Pezzi in magazzino"
          inputMode="numeric"
          value={form.stock}
          onChange={(e) => set("stock", e.target.value)}
          placeholder="0"
          error={errors.stock}
          hint="Promemoria per te. Per toglierlo dalla vendita usa «Disponibile»."
        />
      </div>
    </SectionCard>
  );
}

/** Anteprima della scheda come la vede il cliente nelle liste */
export function PreviewCard({ form }: { form: ProductFormState }) {
  const sale = formSale(form);
  const full = sale.full !== null && sale.full > 0 ? sale.full : null;
  const now = new Date();
  const start = form.saleSchedule && form.saleStart ? dateInputToIso(form.saleStart) : null;
  const end = form.saleSchedule && form.saleEnd ? dateInputToIso(form.saleEnd, true) : null;
  const active =
    form.saleOn && sale.salePrice !== null && full !== null && !(start && new Date(start) > now) && !(end && new Date(end) < now);
  const finalPrice = active && sale.salePrice !== null ? sale.salePrice : full;
  const cover = form.images[0];
  return (
    <div className="card overflow-hidden">
      <p className="border-b border-paper-line px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
        Anteprima nel negozio
      </p>
      <div className="relative aspect-square bg-white">
        {isValidImageSrc(cover) ? (
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="320px"
            className={cn("object-contain p-4", !form.available && "opacity-60")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs font-semibold">Nessuna foto</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {active && full !== null && finalPrice !== null && (
            <Badge tone="sale">-{percentFromPrice(full, finalPrice)}%</Badge>
          )}
          {!form.available && <Badge tone="soldout">Esaurito</Badge>}
        </div>
      </div>
      <div className="space-y-1 border-t border-paper-line p-4">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-faint">{form.marca || " "}</p>
        <p className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug">
          {form.titolo || <span className="text-ink-faint">Nome del prodotto</span>}
        </p>
        {full !== null && finalPrice !== null ? (
          <Price prezzo={full} prezzoFinale={finalPrice} size="sm" />
        ) : (
          <p className="text-sm text-ink-faint">— €</p>
        )}
      </div>
    </div>
  );
}
