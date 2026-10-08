"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/Field";
import { Callout } from "../../Callout";
import { NumberField } from "../../NumberField";
import { Block, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

export function ReturnsSection() {
  const form = useSettingsForm({
    section: "resi",
    keys: ["resi"] as const,
    validate: ({ resi }) => (resi.testo.trim() ? [] : ["Scrivi il testo con le condizioni di reso."]),
  });
  const r = form.draft.resi;

  return (
    <div className="space-y-5">
      <Block
        icon={<RotateCcw className="h-5 w-5" />}
        title="Resi e diritto di recesso"
        description="Le condizioni mostrate nella pagina resi e nella scheda prodotto."
      >
        <NumberField
          label="Giorni per il recesso"
          suffix="giorni"
          min={14}
          max={365}
          value={r.giorni}
          onChange={(giorni) => form.update("resi", (prev) => ({ ...prev, giorni }))}
          hint="Per legge almeno 14 giorni dalla consegna: puoi offrirne di più, non di meno."
          className="sm:max-w-xs"
        />
        <Textarea
          label="Condizioni di reso"
          rows={6}
          value={r.testo}
          maxLength={3000}
          onChange={(e) => form.update("resi", (prev) => ({ ...prev, testo: e.target.value }))}
          hint="Spiega in parole semplici come restituire un prodotto, chi paga la spedizione del reso e i tempi del rimborso."
        />
        <Callout tone="info">
          Le richieste di recesso inviate dai clienti con il modulo online arrivano nella pagina{" "}
          <Link href="/dashboard/recessi">Recessi</Link>, dove trovi anche i passaggi da seguire.
        </Callout>
      </Block>
      <SaveBar form={form} label="Salva resi" />
    </div>
  );
}
