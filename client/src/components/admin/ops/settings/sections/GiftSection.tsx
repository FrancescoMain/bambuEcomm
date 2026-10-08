"use client";

import { Gift } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { NumberField } from "../../NumberField";
import { Toggle } from "../../Toggle";
import { ProductPicker } from "../ProductPicker";
import { Block, Preview, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type GiftSettings = StoreSettings["omaggio"];

const validate = ({ omaggio }: { omaggio: GiftSettings }) => {
  const errors: string[] = [];
  if (omaggio.attivo && !omaggio.prodottoId) errors.push("Scegli il prodotto da regalare (oppure spegni l'omaggio).");
  if (omaggio.attivo && omaggio.soglia <= 0) errors.push("Indica la soglia di spesa per ricevere l'omaggio.");
  return errors;
};

export function GiftSection() {
  const form = useSettingsForm({ section: "omaggio", keys: ["omaggio"] as const, validate });
  const g = form.draft.omaggio;
  const set = (patch: Partial<GiftSettings>) => form.update("omaggio", (prev) => ({ ...prev, ...patch }));
  const example = Math.max(0, g.soglia - Math.max(5, Math.round(g.soglia * 0.25)));

  return (
    <div className="space-y-5">
      <Block
        icon={<Gift className="h-5 w-5" />}
        title="Omaggio sopra una soglia di spesa"
        description="Un prodotto in regalo, aggiunto automaticamente al carrello quando il cliente supera l'importo che scegli."
      >
        <Toggle checked={g.attivo} onChange={(attivo) => set({ attivo })} label="Attiva l'omaggio" />
        <div className={cn("space-y-4 transition-opacity", !g.attivo && "opacity-60")}>
          <NumberField
            label="Soglia di spesa"
            suffix="€"
            decimals={2}
            value={g.soglia}
            onChange={(soglia) => set({ soglia })}
            hint="Sul totale dei prodotti nel carrello."
            className="sm:max-w-xs"
          />
          <ProductPicker label="Prodotto in regalo" value={g.prodottoId} onChange={(prodottoId) => set({ prodottoId })} />
          <Input
            label="Messaggio per il cliente"
            value={g.messaggio}
            onChange={(e) => set({ messaggio: e.target.value })}
            maxLength={160}
            hint="Compare nel carrello per invogliare ad aggiungere qualcosa."
          />
        </div>
        <Preview label="Nel carrello del cliente">
          <div className="space-y-2 rounded-xl bg-white p-3 text-sm">
            <p className="font-semibold">{g.messaggio || "Messaggio dell'omaggio"}</p>
            <div className="h-2 overflow-hidden rounded-full bg-paper-warm">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-orange to-magenta" />
            </div>
            <p className="text-xs text-ink-muted">
              Con {formatPrice(example)} nel carrello: «Ti mancano <strong>{formatPrice(Math.max(0, g.soglia - example))}</strong> per
              ricevere l&apos;omaggio»
            </p>
          </div>
        </Preview>
      </Block>
      <SaveBar form={form} label="Salva omaggio" />
    </div>
  );
}
