"use client";

import { Building2, Clock, ExternalLink, MapPin, Share2 } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { Input } from "@/components/ui/Field";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/shop/icons";
import { ListEditor } from "../../ListEditor";
import { Block, SaveBar } from "../SettingsUi";
import { useSettingsForm } from "../useSettingsForm";

type Contacts = StoreSettings["contatti"];
type Hours = Contacts["orari"][number];
type Social = StoreSettings["social"];
type Company = StoreSettings["azienda"];

const KEYS = ["contatti", "social", "azienda"] as const;
const isUrl = (v: string) => /^https?:\/\/\S+\.\S+/.test(v.trim());

const validate = ({ contatti, social, azienda }: { contatti: Contacts; social: Social; azienda: Company }) => {
  const errors: string[] = [];
  if (contatti.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contatti.email.trim())) errors.push("L'email del negozio non è valida.");
  const wa = contatti.whatsapp.replace(/\D/g, "");
  if (contatti.whatsapp && (wa.length < 11 || wa.length > 15)) {
    errors.push("Il numero WhatsApp deve essere in formato internazionale, es. 393401234567.");
  }
  if (contatti.mappaUrl && !isUrl(contatti.mappaUrl)) errors.push("Il link della mappa deve iniziare con https://");
  (["instagram", "tiktok", "facebook"] as const).forEach((k) => {
    const v = social[k];
    if (v && !isUrl(v)) errors.push(`Il link di ${k === "tiktok" ? "TikTok" : k.charAt(0).toUpperCase() + k.slice(1)} deve iniziare con https://`);
  });
  if (azienda.partitaIva && !/^\d{11}$/.test(azienda.partitaIva.replace(/\s/g, ""))) errors.push("La partita IVA deve avere 11 cifre.");
  contatti.orari.forEach((o, i) => {
    if (!o.giorni.trim() || !o.orario.trim()) errors.push(`Orari, riga ${i + 1}: indica giorni e orario (o elimina la riga).`);
  });
  return errors;
};

function TestLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
      {children} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function StoreSection() {
  const form = useSettingsForm({ section: "negozio", keys: KEYS, validate });
  const { contatti: c, social, azienda } = form.draft;
  const setC = (patch: Partial<Contacts>) => form.update("contatti", (prev) => ({ ...prev, ...patch }));
  const setS = (patch: Partial<Social>) => form.update("social", (prev) => ({ ...prev, ...patch }));
  const setA = (patch: Partial<Company>) => form.update("azienda", (prev) => ({ ...prev, ...patch }));

  const waDigits = c.whatsapp.replace(/\D/g, "");
  const waMissingPrefix = waDigits.length === 10 && waDigits.startsWith("3");

  return (
    <div className="space-y-5">
      <Block icon={<MapPin className="h-5 w-5" />} title="Contatti e negozio" description="Compaiono nel piè di pagina, nella pagina contatti e nelle email.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Telefono" type="tel" value={c.telefono} onChange={(e) => setC({ telefono: e.target.value })} placeholder="081 123 4567" />
          <div>
            <Input
              label="WhatsApp"
              type="tel"
              inputMode="numeric"
              value={c.whatsapp}
              onChange={(e) => setC({ whatsapp: e.target.value.replace(/[^\d+\s]/g, "") })}
              onBlur={() => setC({ whatsapp: c.whatsapp.replace(/\D/g, "") })}
              placeholder="393401234567"
              hint="Formato internazionale, es. 393401234567 (39 + numero, senza spazi né +)."
            />
            {waMissingPrefix ? (
              <button
                type="button"
                onClick={() => setC({ whatsapp: `39${waDigits}` })}
                className="mt-1.5 text-xs font-semibold text-orange-ink underline"
              >
                Manca il prefisso: aggiungi 39 davanti
              </button>
            ) : (
              waDigits.length >= 11 && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-leaf-ink" />
                  <TestLink href={`https://wa.me/${waDigits}`}>Prova il link</TestLink>
                </p>
              )
            )}
          </div>
          <Input label="Email" type="email" value={c.email} onChange={(e) => setC({ email: e.target.value })} className="sm:col-span-2" />
          <Input label="Indirizzo" value={c.indirizzo} onChange={(e) => setC({ indirizzo: e.target.value })} placeholder="Corso Umberto I, 367" />
          <Input label="CAP, città e provincia" value={c.citta} onChange={(e) => setC({ citta: e.target.value })} placeholder="80058 Torre Annunziata (NA)" />
          <div className="sm:col-span-2">
            <Input
              label="Link a Google Maps"
              type="url"
              value={c.mappaUrl}
              onChange={(e) => setC({ mappaUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=…"
              hint="Su Google Maps cerca il negozio, premi «Condividi» e incolla qui il link."
            />
            {isUrl(c.mappaUrl) && (
              <p className="mt-1 text-xs">
                <TestLink href={c.mappaUrl}>Apri la mappa</TestLink>
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Clock className="h-4 w-4 text-ink-muted" /> Orari di apertura
          </p>
          <p className="mb-3 text-xs text-ink-muted">Una riga per ogni gruppo di giorni, es. «Lunedì - Venerdì» e «9:00 - 13:00 · 16:00 - 20:00».</p>
          <ListEditor<Hours>
            layout="row"
            items={c.orari}
            onChange={(orari) => setC({ orari })}
            createItem={() => ({ giorni: "", orario: "" })}
            itemName="riga degli orari"
            addLabel="Aggiungi riga"
            max={10}
            renderItem={(o, update, i) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <input
                  aria-label={`Giorni, riga ${i + 1}`}
                  value={o.giorni}
                  placeholder="Lunedì - Venerdì"
                  onChange={(e) => update({ giorni: e.target.value })}
                  className="field"
                />
                <input
                  aria-label={`Orario, riga ${i + 1}`}
                  value={o.orario}
                  placeholder="9:00 - 13:00 · 16:00 - 20:00"
                  onChange={(e) => update({ orario: e.target.value })}
                  className="field"
                />
              </div>
            )}
          />
        </div>
      </Block>

      <Block icon={<Share2 className="h-5 w-5" />} title="Social" description="Lascia vuoto un campo per nascondere l'icona dal sito.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              ["instagram", "Instagram", InstagramIcon, "https://www.instagram.com/…"],
              ["tiktok", "TikTok", TikTokIcon, "https://www.tiktok.com/@…"],
              ["facebook", "Facebook", FacebookIcon, "https://www.facebook.com/…"],
            ] as const
          ).map(([key, label, Icon, placeholder]) => (
            <div key={key}>
              <Input label={label} type="url" value={social[key] ?? ""} placeholder={placeholder} onChange={(e) => setS({ [key]: e.target.value })} />
              {social[key] && isUrl(social[key] ?? "") && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs">
                  <Icon className="h-3.5 w-3.5 text-ink-muted" />
                  <TestLink href={social[key] ?? ""}>Apri</TestLink>
                </p>
              )}
            </div>
          ))}
        </div>
      </Block>

      <Block icon={<Building2 className="h-5 w-5" />} title="Dati aziendali" description="Compaiono nel piè di pagina, nelle email e sulla distinta d'ordine stampata.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Ragione sociale" value={azienda.ragioneSociale} onChange={(e) => setA({ ragioneSociale: e.target.value })} />
          <Input
            label="Partita IVA"
            inputMode="numeric"
            value={azienda.partitaIva}
            maxLength={13}
            onChange={(e) => setA({ partitaIva: e.target.value.replace(/[^\d\s]/g, "") })}
            onBlur={() => setA({ partitaIva: azienda.partitaIva.replace(/\s/g, "") })}
            placeholder="11 cifre"
          />
        </div>
      </Block>

      <SaveBar form={form} label="Salva dati del negozio" />
    </div>
  );
}
