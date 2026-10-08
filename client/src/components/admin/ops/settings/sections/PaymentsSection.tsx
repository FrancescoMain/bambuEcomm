"use client";

import { Banknote, CreditCard, ExternalLink } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NumberField } from "../../NumberField";
import { Toggle } from "../../Toggle";
import { Block, Preview, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type Payments = StoreSettings["pagamenti"];

export function PaymentsSection() {
  const form = useSettingsForm({ section: "pagamenti", keys: ["pagamenti"] as const });
  const cod = form.draft.pagamenti.contrassegno;
  const setCod = (patch: Partial<Payments["contrassegno"]>) =>
    form.update("pagamenti", (prev) => ({ ...prev, contrassegno: { ...prev.contrassegno, ...patch } }));

  return (
    <div className="space-y-5">
      <Block
        icon={<CreditCard className="h-5 w-5" />}
        title="Pagamenti online"
        description="Carte di credito e debito, Apple Pay, Google Pay, PayPal, Klarna…"
      >
        <p className="text-[15px] leading-relaxed text-ink-soft">
          I pagamenti online passano da <strong>Stripe</strong>, che accredita gli incassi sul conto del negozio. Per attivare o
          spegnere un metodo di pagamento (ad esempio PayPal o il pagamento a rate con Klarna) non serve modificare il sito: si fa
          dalla dashboard di Stripe, alla voce «Metodi di pagamento». Al checkout i clienti vedranno subito i metodi attivi.
        </p>
        <a
          href="https://dashboard.stripe.com/settings/payment_methods"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "sm")}
        >
          Apri i metodi di pagamento su Stripe <ExternalLink className="h-4 w-4" />
        </a>
      </Block>

      <Block
        icon={<Banknote className="h-5 w-5" />}
        title="Pagamento alla consegna (contrassegno)"
        description="Il cliente paga in contanti al corriere o alla consegna."
      >
        <Toggle
          checked={cod.attivo}
          onChange={(attivo) => setCod({ attivo })}
          label="Accetta il contrassegno"
          description="Non è disponibile per i prodotti personalizzati. Gli ordini in contrassegno compaiono in «Da preparare»."
        />
        <div className={cn("transition-opacity", !cod.attivo && "opacity-60")}>
          <NumberField
            label="Commissione per il cliente"
            suffix="€"
            decimals={2}
            value={cod.commissione}
            onChange={(commissione) => setCod({ commissione })}
            hint="Si aggiunge al totale dell'ordine (metti 0 per non applicarla)."
            className="sm:max-w-xs"
          />
        </div>
        <Preview label="Cosa vede il cliente al checkout">
          {cod.attivo ? (
            <p className="text-sm">
              <strong>Pagamento alla consegna</strong>
              {cod.commissione > 0 ? ` (+${formatPrice(cod.commissione)})` : " (senza costi aggiuntivi)"}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">Il contrassegno non viene proposto: solo pagamento online.</p>
          )}
        </Preview>
      </Block>

      <SaveBar form={form} label="Salva pagamenti" />
    </div>
  );
}
