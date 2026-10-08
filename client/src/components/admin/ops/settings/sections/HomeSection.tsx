"use client";

import { BadgeCheck, GalleryHorizontal, LayoutGrid, Megaphone, Timer } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { Input } from "@/components/ui/Field";
import { SingleImageUploader } from "@/components/admin/ImageUploader";
import { cn } from "@/lib/cn";
import { ListEditor, StringListEditor } from "../../ListEditor";
import { Toggle } from "../../Toggle";
import { fromLocalInput, toLocalInput } from "../../dates";
import { BannerPreview, CountdownPreview, ServicePreview, TilePreview, TopBarPreview } from "../previews";
import { Block, ColorPicker, IconPicker, LinkInput, PlaceholderHint, Preview, SaveBar, fillPlaceholders, isValidLink } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type HomeDraft = Pick<StoreSettings, "topBar" | "countdown" | "banner" | "vetrine" | "servizi">;
type Banner = StoreSettings["banner"][number];
type Tile = StoreSettings["vetrine"][number];
type Service = StoreSettings["servizi"][number];

const KEYS = ["topBar", "countdown", "banner", "vetrine", "servizi"] as const;

const validate = (d: HomeDraft) => {
  const errors: string[] = [];
  if (d.topBar.attivo && !d.topBar.messaggi.some((m) => m.trim())) errors.push("Barra messaggi: scrivi almeno un messaggio o spegnila.");
  if (d.countdown.attivo && !d.countdown.data) errors.push("Countdown: scegli la data e l'ora di fine.");
  if (d.countdown.link && !isValidLink(d.countdown.link.trim())) errors.push("Countdown: il link non è valido.");
  d.banner.forEach((b, i) => {
    if (!b.titolo.trim()) errors.push(`Banner ${i + 1}: manca il titolo.`);
    if (b.link && !isValidLink(b.link.trim())) errors.push(`Banner ${i + 1}: il link non è valido.`);
  });
  d.vetrine.forEach((t, i) => {
    if (!t.titolo.trim()) errors.push(`Vetrina ${i + 1}: manca il titolo.`);
    if (!t.link.trim() || !isValidLink(t.link.trim())) errors.push(`Vetrina ${i + 1}: serve un link valido.`);
  });
  d.servizi.forEach((s, i) => {
    if (!s.titolo.trim()) errors.push(`Vantaggio ${i + 1}: manca il titolo.`);
  });
  return errors;
};

const SUBSECTIONS = [
  { id: "home-barra", label: "Barra messaggi" },
  { id: "home-countdown", label: "Countdown" },
  { id: "home-banner", label: "Banner" },
  { id: "home-vetrine", label: "Vetrine" },
  { id: "home-vantaggi", label: "Vantaggi" },
];

export function HomeSection() {
  const form = useSettingsForm({ section: "home", keys: KEYS, validate });
  const { topBar, countdown, banner, vetrine, servizi } = form.draft;
  const shipping = form.latest.spedizione;

  return (
    <div className="space-y-5">
      <nav aria-label="Parti della home page" className="flex flex-wrap gap-2">
        {SUBSECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-paper-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div id="home-barra" className="scroll-mt-20">
        <Block
          icon={<Megaphone className="h-5 w-5" />}
          title="Barra messaggi in alto"
          description="La striscia nera in cima a tutte le pagine: i messaggi si alternano ogni pochi secondi."
        >
          <Toggle
            checked={topBar.attivo}
            onChange={(attivo) => form.update("topBar", (prev) => ({ ...prev, attivo }))}
            label="Mostra la barra messaggi"
          />
          <div className={cn("space-y-3 transition-opacity", !topBar.attivo && "opacity-60")}>
            <StringListEditor
              items={topBar.messaggi}
              onChange={(messaggi) => form.update("topBar", (prev) => ({ ...prev, messaggi }))}
              placeholder="Es. Spedizione gratuita sopra i {soglia}"
              addLabel="Aggiungi messaggio"
              itemName="messaggio"
              max={6}
              maxLength={120}
            />
            <PlaceholderHint spedizione={shipping} />
          </div>
          <Preview>
            {topBar.attivo ? (
              <TopBarPreview messages={topBar.messaggi.map((m) => fillPlaceholders(m, shipping))} />
            ) : (
              <p className="text-sm text-ink-muted">La barra è spenta e non viene mostrata.</p>
            )}
          </Preview>
        </Block>
      </div>

      <div id="home-countdown" className="scroll-mt-20">
        <Block
          icon={<Timer className="h-5 w-5" />}
          title="Conto alla rovescia"
          description="Una striscia colorata con i giorni che mancano a un evento (rientro a scuola, Black Friday…). Sparisce da sola alla scadenza."
        >
          <Toggle
            checked={countdown.attivo}
            onChange={(attivo) => form.update("countdown", (prev) => ({ ...prev, attivo }))}
            label="Mostra il countdown"
          />
          <div className={cn("space-y-4 transition-opacity", !countdown.attivo && "opacity-60")}>
            <Input
              label="Testo"
              value={countdown.titolo}
              onChange={(e) => form.update("countdown", (prev) => ({ ...prev, titolo: e.target.value }))}
              maxLength={100}
              placeholder="Mancano pochi giorni al rientro a scuola!"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Fino a (data e ora)"
                type="datetime-local"
                value={toLocalInput(countdown.data)}
                onChange={(e) => form.update("countdown", (prev) => ({ ...prev, data: fromLocalInput(e.target.value) }))}
              />
              <LinkInput
                label="Link (facoltativo)"
                value={countdown.link}
                onChange={(link) => form.update("countdown", (prev) => ({ ...prev, link }))}
              />
            </div>
          </div>
          <Preview>
            {countdown.attivo ? (
              <CountdownPreview titolo={countdown.titolo} data={countdown.data} />
            ) : (
              <p className="text-sm text-ink-muted">Il countdown è spento.</p>
            )}
          </Preview>
        </Block>
      </div>

      <div id="home-banner" className="scroll-mt-20">
        <Block
          icon={<GalleryHorizontal className="h-5 w-5" />}
          title="Banner principali (slider)"
          description="Le grandi immagini in cima alla home: scorrono da sole. Il primo è il più importante."
        >
          <ListEditor<Banner>
            items={banner}
            onChange={(next) => form.update("banner", () => next)}
            createItem={() => ({ titolo: "", sottotitolo: "", link: "", cta: "", colore: "green" })}
            itemTitle={(b, i) => b.titolo || `Banner ${i + 1}`}
            itemName="banner"
            addLabel="Aggiungi banner"
            max={8}
            emptyText="Nessun banner: la home parte direttamente dai prodotti."
            renderItem={(b, update, i) => (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
                <div className="space-y-3">
                  <Input label="Titolo" required value={b.titolo} maxLength={80} onChange={(e) => update({ titolo: e.target.value })} />
                  <Input
                    label="Sottotitolo"
                    value={b.sottotitolo ?? ""}
                    maxLength={160}
                    onChange={(e) => update({ sottotitolo: e.target.value })}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LinkInput label="Link del pulsante" value={b.link ?? ""} onChange={(link) => update({ link })} />
                    <Input
                      label="Testo del pulsante"
                      value={b.cta ?? ""}
                      maxLength={40}
                      placeholder="Scopri di più"
                      onChange={(e) => update({ cta: e.target.value })}
                    />
                  </div>
                  <ColorPicker value={b.colore} onChange={(colore) => update({ colore })} />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="field-label">Immagine (orizzontale)</p>
                    <SingleImageUploader
                      value={b.immagine}
                      onChange={(url) => update({ immagine: url ?? undefined })}
                      folder="banner"
                      aspect="aspect-video"
                    />
                  </div>
                  <BannerPreview banner={b} index={i} />
                </div>
              </div>
            )}
          />
        </Block>
      </div>

      <div id="home-vetrine" className="scroll-mt-20">
        <Block
          icon={<LayoutGrid className="h-5 w-5" />}
          title="Vetrine"
          description="I riquadri colorati sotto lo slider che portano alle sezioni principali (massimo 4)."
        >
          <ListEditor<Tile>
            items={vetrine}
            onChange={(next) => form.update("vetrine", () => next)}
            createItem={() => ({ titolo: "", testo: "", link: "", colore: "green" })}
            itemTitle={(t, i) => t.titolo || `Vetrina ${i + 1}`}
            itemName="vetrina"
            addLabel="Aggiungi vetrina"
            max={4}
            emptyText="Nessuna vetrina."
            renderItem={(t, update) => (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Titolo" required value={t.titolo} maxLength={40} onChange={(e) => update({ titolo: e.target.value })} />
                    <Input label="Testo breve" value={t.testo ?? ""} maxLength={60} onChange={(e) => update({ testo: e.target.value })} />
                  </div>
                  <LinkInput label="Link" required value={t.link} onChange={(link) => update({ link })} />
                  <ColorPicker value={t.colore} onChange={(colore) => update({ colore })} />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="field-label">Immagine (facoltativa)</p>
                    <SingleImageUploader
                      value={t.immagine}
                      onChange={(url) => update({ immagine: url ?? undefined })}
                      folder="banner"
                      aspect="aspect-[4/3]"
                    />
                  </div>
                  <TilePreview tile={t} />
                </div>
              </div>
            )}
          />
        </Block>
      </div>

      <div id="home-vantaggi" className="scroll-mt-20">
        <Block
          icon={<BadgeCheck className="h-5 w-5" />}
          title="Vantaggi del negozio"
          description="La fila di riquadri con icona (spedizione, ritiro, pagamenti sicuri…). Ne consigliamo 4 o 5."
        >
          <PlaceholderHint spedizione={shipping} />
          <ListEditor<Service>
            items={servizi}
            onChange={(next) => form.update("servizi", () => next)}
            createItem={() => ({ titolo: "", descrizione: "", icona: "truck" })}
            itemTitle={(s, i) => s.titolo || `Vantaggio ${i + 1}`}
            itemName="vantaggio"
            addLabel="Aggiungi vantaggio"
            max={8}
            renderItem={(s, update, i) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Titolo" required value={s.titolo} maxLength={40} onChange={(e) => update({ titolo: e.target.value })} />
                  <Input
                    label="Descrizione"
                    value={s.descrizione}
                    maxLength={60}
                    onChange={(e) => update({ descrizione: e.target.value })}
                  />
                </div>
                <IconPicker value={s.icona} onChange={(icona) => update({ icona })} />
                <div className="sm:max-w-xs">
                  <ServicePreview servizio={{ ...s, descrizione: fillPlaceholders(s.descrizione, shipping) }} index={i} />
                </div>
              </div>
            )}
          />
        </Block>
      </div>

      <SaveBar form={form} label="Salva home page" />
    </div>
  );
}
