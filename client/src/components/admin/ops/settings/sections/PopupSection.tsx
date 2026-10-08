"use client";

import { Mail } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { NumberField } from "../../NumberField";
import { Toggle } from "../../Toggle";
import { PopupPreview } from "../previews";
import { Block, Preview, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

export function PopupSection() {
  const form = useSettingsForm({
    section: "popup",
    keys: ["newsletterPopup"] as const,
    validate: ({ newsletterPopup: p }) => (p.attivo && !p.titolo.trim() ? ["Scrivi il titolo del popup."] : []),
  });
  const p = form.draft.newsletterPopup;
  const set = (patch: Partial<typeof p>) => form.update("newsletterPopup", (prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-5">
      <Block
        icon={<Mail className="h-5 w-5" />}
        title="Popup di iscrizione alla newsletter"
        description="Una finestra che invita i visitatori a iscriversi. Compare una sola volta per visitatore, dopo qualche secondo."
      >
        <Toggle checked={p.attivo} onChange={(attivo) => set({ attivo })} label="Mostra il popup" />
        <div className={cn("space-y-4 transition-opacity", !p.attivo && "opacity-60")}>
          <Input label="Titolo" value={p.titolo} maxLength={80} onChange={(e) => set({ titolo: e.target.value })} />
          <Textarea
            label="Testo"
            rows={3}
            className="[&_textarea]:min-h-[80px]"
            value={p.testo}
            maxLength={300}
            onChange={(e) => set({ testo: e.target.value })}
            hint="Spiega cosa riceverà chi si iscrive (novità, offerte, idee…)."
          />
          <NumberField
            label="Mostra dopo"
            suffix="secondi"
            max={600}
            value={p.ritardoSecondi}
            onChange={(ritardoSecondi) => set({ ritardoSecondi })}
            hint="Consigliati 15-30 secondi: il visitatore ha il tempo di guardarsi intorno."
            className="sm:max-w-xs"
          />
        </div>
        <Preview>
          <PopupPreview titolo={p.titolo} testo={p.testo} />
        </Preview>
      </Block>
      <SaveBar form={form} label="Salva popup" />
    </div>
  );
}
