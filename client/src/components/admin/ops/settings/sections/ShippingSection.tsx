"use client";

import { Store, Truck, Zap } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { Input, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { ChipsInput } from "../../ChipsInput";
import { NumberField } from "../../NumberField";
import { Toggle } from "../../Toggle";
import { addBusinessDays } from "../../dates";
import { Block, Preview, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type Shipping = StoreSettings["spedizione"];

const validate = ({ spedizione: s }: { spedizione: Shipping }) => {
  const errors: string[] = [];
  if (s.giorniTransitoMax < s.giorniTransitoMin) errors.push("Il transito massimo non può essere minore del minimo.");
  if (!s.tempiConsegna.trim()) errors.push("Scrivi i tempi di consegna da mostrare ai clienti (es. 2-4 giorni lavorativi).");
  if (s.giornata.attivo && !s.giornata.cap.length) errors.push("Aggiungi almeno un CAP per la consegna in giornata.");
  if (!/^\d{1,2}:\d{2}$/.test(s.giornata.orarioLimite)) errors.push("Indica l'orario limite della consegna in giornata (es. 13:00).");
  return errors;
};

const shortDate = (d: Date) => formatDate(d, { weekday: "short", year: undefined, month: "short" });

export function ShippingSection() {
  const form = useSettingsForm({ section: "spedizioni", keys: ["spedizione"] as const, validate });
  const s = form.draft.spedizione;
  const set = (patch: Partial<Shipping>) => form.update("spedizione", (prev) => ({ ...prev, ...patch }));
  const setDay = (patch: Partial<Shipping["giornata"]>) =>
    form.update("spedizione", (prev) => ({ ...prev, giornata: { ...prev.giornata, ...patch } }));

  const today = new Date();
  const ready = addBusinessDays(today, s.giorniLavorazione);
  const from = addBusinessDays(ready, s.giorniTransitoMin);
  const to = addBusinessDays(ready, Math.max(s.giorniTransitoMin, s.giorniTransitoMax));

  return (
    <div className="space-y-5">
      <Block icon={<Truck className="h-5 w-5" />} title="Spedizione con corriere" description="Costo e tempi della spedizione in tutta Italia.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Costo della spedizione" suffix="€" decimals={2} value={s.costo} onChange={(costo) => set({ costo })} />
          <NumberField
            label="Spedizione gratuita da"
            suffix="€"
            decimals={2}
            value={s.sogliaGratuita}
            onChange={(sogliaGratuita) => set({ sogliaGratuita })}
            hint="Dagli ordini di questo importo in su la spedizione è gratis."
          />
        </div>
        <Input
          label="Tempi di consegna (testo per i clienti)"
          value={s.tempiConsegna}
          onChange={(e) => set({ tempiConsegna: e.target.value })}
          placeholder="2-4 giorni lavorativi"
          maxLength={80}
        />
        <fieldset>
          <legend className="text-sm font-bold text-ink">Stima della data di consegna</legend>
          <p className="mb-3 text-xs text-ink-muted">
            Servono a calcolare la data di arrivo mostrata nella scheda prodotto e al checkout (solo giorni lavorativi).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField
              label="Giorni di preparazione"
              suffix="giorni"
              max={30}
              value={s.giorniLavorazione}
              onChange={(giorniLavorazione) => set({ giorniLavorazione })}
            />
            <NumberField
              label="Corriere: minimo"
              suffix="giorni"
              max={30}
              value={s.giorniTransitoMin}
              onChange={(giorniTransitoMin) => set({ giorniTransitoMin })}
            />
            <NumberField
              label="Corriere: massimo"
              suffix="giorni"
              max={30}
              value={s.giorniTransitoMax}
              onChange={(giorniTransitoMax) => set({ giorniTransitoMax })}
            />
          </div>
        </fieldset>
        <Preview label="Cosa vede il cliente">
          <ul className="space-y-1.5 text-sm">
            <li>
              Spedizione: <strong>{s.costo > 0 ? formatPrice(s.costo) : "gratis"}</strong>
              {s.costo > 0 && s.sogliaGratuita > 0 && (
                <>
                  {" "}
                  · <strong>gratis</strong> da {formatPrice(s.sogliaGratuita)}
                </>
              )}
            </li>
            <li>
              Ordinando oggi, arriva tra <strong>{shortDate(from)}</strong> e <strong>{shortDate(to)}</strong>
            </li>
          </ul>
        </Preview>
      </Block>

      <Block
        icon={<Store className="h-5 w-5" />}
        title="Ritiro in negozio"
        description="Il cliente sceglie «Ritiro in negozio» al checkout e non paga la spedizione."
      >
        <Toggle
          checked={s.ritiroInNegozio}
          onChange={(ritiroInNegozio) => set({ ritiroInNegozio })}
          label="Permetti il ritiro gratuito in negozio"
          description="Quando l'ordine è pronto premi «Pronto per il ritiro» nella pagina Ordini: il cliente riceve un'email."
        />
      </Block>

      <Block
        icon={<Zap className="h-5 w-5" />}
        title="Consegna in giornata"
        description="Consegna a mano nelle zone vicine al negozio, per gli ordini fatti entro un certo orario (dal lunedì al sabato)."
      >
        <Toggle checked={s.giornata.attivo} onChange={(attivo) => setDay({ attivo })} label="Offri la consegna in giornata" />
        <div className={cn("space-y-4 transition-opacity", !s.giornata.attivo && "opacity-60")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="Costo della consegna"
              suffix="€"
              decimals={2}
              value={s.giornata.costo}
              onChange={(costo) => setDay({ costo })}
            />
            <Input
              label="Ordini entro le"
              type="time"
              value={s.giornata.orarioLimite}
              onChange={(e) => setDay({ orarioLimite: e.target.value })}
              hint="Dopo quest'ora l'opzione non compare più fino al giorno dopo."
            />
          </div>
          <ChipsInput
            label="CAP serviti"
            values={s.giornata.cap}
            onChange={(cap) => setDay({ cap })}
            validate={(v) => /^\d{5}$/.test(v)}
            inputMode="numeric"
            maxLength={60}
            placeholder="Scrivi un CAP e premi Invio"
            hint="Solo i clienti con questi CAP vedono la consegna in giornata. Puoi incollarne più di uno separati da virgola."
          />
          <Textarea
            label="Descrizione per i clienti"
            rows={2}
            className="[&_textarea]:min-h-[72px]"
            value={s.giornata.descrizione}
            onChange={(e) => setDay({ descrizione: e.target.value })}
            maxLength={200}
          />
          <Preview label="Cosa vede il cliente al checkout">
            <p className="text-sm">
              <strong>Consegna in giornata</strong> · {s.giornata.costo > 0 ? formatPrice(s.giornata.costo) : "gratis"}
              <br />
              <span className="text-ink-muted">
                {s.giornata.descrizione || `Per ordini entro le ${s.giornata.orarioLimite}`} — solo CAP{" "}
                {s.giornata.cap.length ? s.giornata.cap.join(", ") : "…"}
              </span>
            </p>
            {!s.giornata.attivo && <p className="mt-1.5 text-xs font-semibold text-ink-muted">Ora è spenta: i clienti non la vedono.</p>}
          </Preview>
        </div>
      </Block>

      <SaveBar form={form} label="Salva spedizioni" />
    </div>
  );
}
