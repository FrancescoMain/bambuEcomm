"use client";

import { CircleHelp } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { Input, Textarea } from "@/components/ui/Field";
import { ListEditor } from "../../ListEditor";
import { Block, PlaceholderHint, SaveBar, fillPlaceholders } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type Faq = StoreSettings["faq"][number];

const validate = ({ faq }: { faq: Faq[] }) =>
  faq.flatMap((f, i) => {
    const errors: string[] = [];
    if (!f.domanda.trim()) errors.push(`Domanda ${i + 1}: manca il testo della domanda.`);
    if (!f.risposta.trim()) errors.push(`Domanda ${i + 1}: manca la risposta.`);
    return errors;
  });

export function FaqSection() {
  const form = useSettingsForm({ section: "faq", keys: ["faq"] as const, validate });

  return (
    <div className="space-y-5">
      <Block
        icon={<CircleHelp className="h-5 w-5" />}
        title="Domande frequenti"
        description="Compaiono nella pagina FAQ e aiutano i clienti a trovare subito una risposta (e anche Google le mostra nei risultati)."
      >
        <PlaceholderHint spedizione={form.latest.spedizione} />
        <ListEditor<Faq>
          items={form.draft.faq}
          onChange={(faq) => form.update("faq", () => faq)}
          createItem={() => ({ domanda: "", risposta: "" })}
          itemTitle={(f, i) => f.domanda || `Domanda ${i + 1}`}
          itemName="domanda"
          addLabel="Aggiungi domanda"
          max={40}
          emptyText="Nessuna domanda: aggiungi le domande che i clienti ti fanno più spesso."
          renderItem={(f, update) => (
            <div className="space-y-3">
              <Input label="Domanda" value={f.domanda} maxLength={200} onChange={(e) => update({ domanda: e.target.value })} />
              <Textarea
                label="Risposta"
                rows={3}
                className="[&_textarea]:min-h-[88px]"
                value={f.risposta}
                maxLength={1500}
                onChange={(e) => update({ risposta: e.target.value })}
              />
              {/\{(soglia|costo)\}/.test(f.risposta) && (
                <p className="rounded-xl bg-white px-3 py-2 text-xs text-ink-soft">
                  <span className="font-bold text-ink-muted">Sul sito: </span>
                  {fillPlaceholders(f.risposta, form.latest.spedizione)}
                </p>
              )}
            </div>
          )}
        />
      </Block>
      <SaveBar form={form} label="Salva FAQ" />
    </div>
  );
}
