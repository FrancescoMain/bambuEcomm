import { Clock, Mail, MapPin, Navigation, Phone, Store } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { whatsappUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/shop/icons";
import { formatWhatsapp, telHref } from "./tones";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-warm text-brand-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</span>
        <span className="mt-0.5 block break-words text-[15px] text-ink">{children}</span>
      </span>
    </li>
  );
}

const link = "font-semibold hover:text-brand-700 hover:underline";

/** Scheda del negozio: indirizzo, telefono, WhatsApp, email, orari e indicazioni */
export function StoreInfoCard({
  contatti,
  title = "Il negozio",
  headingLevel = 2,
  className,
}: {
  contatti: StoreSettings["contatti"];
  title?: string;
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("rounded-3xl border border-paper-line bg-white p-6 sm:p-8", className)}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Store className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <Heading className="text-xl font-extrabold">{title}</Heading>
          <p className="text-sm text-ink-muted">Cartoleria Bambù · Torre Annunziata</p>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        <Row icon={<MapPin className="h-[18px] w-[18px]" aria-hidden />} label="Indirizzo">
          <a href={contatti.mappaUrl} target="_blank" rel="noopener noreferrer" className={link}>
            {contatti.indirizzo}
            <span className="block font-normal text-ink-soft">{contatti.citta}</span>
          </a>
        </Row>
        {contatti.telefono && (
          <Row icon={<Phone className="h-[18px] w-[18px]" aria-hidden />} label="Telefono">
            <a href={telHref(contatti.telefono)} className={link}>
              {contatti.telefono}
            </a>
          </Row>
        )}
        {contatti.whatsapp && (
          <Row icon={<WhatsAppIcon className="h-[18px] w-[18px]" />} label="WhatsApp">
            <a href={whatsappUrl(contatti.whatsapp)} target="_blank" rel="noopener noreferrer" className={link}>
              {formatWhatsapp(contatti.whatsapp)}
            </a>
          </Row>
        )}
        {contatti.email && (
          <Row icon={<Mail className="h-[18px] w-[18px]" aria-hidden />} label="Email">
            <a href={`mailto:${contatti.email}`} className={link}>
              {contatti.email}
            </a>
          </Row>
        )}
      </ul>

      {contatti.orari.length > 0 && (
        <div className="mt-6 rounded-2xl bg-paper-warm p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Clock className="h-4 w-4 text-brand-600" aria-hidden /> Orari di apertura
          </p>
          <dl className="mt-3 space-y-2 text-[15px]">
            {contatti.orari.map((o) => (
              <div key={o.giorni} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                <dt className="font-semibold text-ink">{o.giorni}</dt>
                <dd className="text-ink-soft">{o.orario}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <a href={contatti.mappaUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
          <Navigation className="h-4 w-4" aria-hidden /> Indicazioni stradali
        </a>
        {contatti.whatsapp && (
          <a
            href={whatsappUrl(contatti.whatsapp, "Ciao! Vorrei qualche informazione")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("outline", "md")}
          >
            <WhatsAppIcon className="h-4 w-4 text-[#1faa53]" /> Scrivici su WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
