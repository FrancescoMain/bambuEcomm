import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Briefcase, Mail, MapPin, Phone, School } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { whatsappUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { ContactForm } from "@/components/forms/ContactForm";
import { HelpLinks } from "@/components/content/HelpLinks";
import { MapEmbed } from "@/components/content/MapEmbed";
import { StoreInfoCard } from "@/components/content/StoreInfoCard";
import { TONE, formatWhatsapp, telHref, type Tone } from "@/components/content/tones";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Contatta Cartoleria Bambù: modulo online, WhatsApp, telefono ed email. Il negozio è in Corso Umberto I 367 a Torre Annunziata (NA): orari e indicazioni.",
  alternates: { canonical: "/contatti" },
};

function Channel({
  href,
  label,
  value,
  icon,
  tone,
  external,
}: {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: Tone;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group flex items-center gap-3 rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-card sm:p-5",
        TONE[tone].soft
      )}
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm", TONE[tone].icon)}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-xs font-bold uppercase tracking-wide", TONE[tone].ink)}>{label}</span>
        <span className="block font-extrabold leading-snug text-ink [overflow-wrap:anywhere]">{value}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:text-ink" aria-hidden />
    </a>
  );
}

export default async function ContattiPage() {
  const { contatti } = await getSettings();

  return (
    <>
      <PageHeader
        title="Contatti"
        subtitle="Scrivici, chiamaci o passa in negozio: siamo felici di aiutarti a trovare quello che cerchi."
      />

      <div className="container space-y-14 py-10 sm:space-y-20 sm:py-14">
        <section aria-label="Come contattarci">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contatti.whatsapp && (
              <li>
                <Channel
                  href={whatsappUrl(contatti.whatsapp, "Ciao! Vorrei qualche informazione")}
                  label="WhatsApp"
                  value={formatWhatsapp(contatti.whatsapp)}
                  icon={<WhatsAppIcon className="h-6 w-6" />}
                  tone="leaf"
                  external
                />
              </li>
            )}
            {contatti.telefono && (
              <li>
                <Channel
                  href={telHref(contatti.telefono)}
                  label="Telefono"
                  value={contatti.telefono}
                  icon={<Phone className="h-6 w-6" aria-hidden />}
                  tone="sky"
                />
              </li>
            )}
            {contatti.email && (
              <li>
                <Channel
                  href={`mailto:${contatti.email}`}
                  label="Email"
                  value={contatti.email}
                  icon={<Mail className="h-6 w-6" aria-hidden />}
                  tone="magenta"
                />
              </li>
            )}
            <li>
              <Channel
                href="#negozio"
                label="Negozio"
                value={contatti.indirizzo}
                icon={<MapPin className="h-6 w-6" aria-hidden />}
                tone="orange"
              />
            </li>
          </ul>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          <section className="rounded-3xl border border-paper-line bg-white p-6 shadow-card sm:p-10" aria-label="Modulo di contatto">
            <ContactForm whatsapp={contatti.whatsapp} />
          </section>

          <aside className="space-y-8">
            <div>
              <h2 className="text-xl font-extrabold">Forse la risposta è già qui</h2>
              <p className="mt-1 text-[15px] text-ink-muted">Spedizioni, resi e ordini: le domande più comuni.</p>
              <HelpLinks exclude={["/contatti"]} compact className="mt-4" />
            </div>
            <div className="rounded-3xl bg-ink p-6 text-white">
              <h2 className="text-xl font-extrabold text-white">Scuole, uffici e negozi</h2>
              <p className="mt-1 text-sm text-white/70">Forniture su misura e condizioni dedicate.</p>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/preventivi"
                    className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-[15px] font-bold transition hover:bg-white/15"
                  >
                    <School className="h-5 w-5 text-orange" aria-hidden /> Richiedi un preventivo
                    <ArrowUpRight className="ml-auto h-4 w-4 text-white/60" aria-hidden />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rivenditori"
                    className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-[15px] font-bold transition hover:bg-white/15"
                  >
                    <Briefcase className="h-5 w-5 text-sky" aria-hidden /> Diventa rivenditore
                    <ArrowUpRight className="ml-auto h-4 w-4 text-white/60" aria-hidden />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <section id="negozio" className="scroll-mt-32 grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:gap-8" aria-label="Il negozio">
          <StoreInfoCard contatti={contatti} title="Il negozio a Torre Annunziata" />
          <MapEmbed
            query={`${contatti.indirizzo}, ${contatti.citta}`}
            href={contatti.mappaUrl}
            title={`Mappa: Cartoleria Bambù, ${contatti.indirizzo}, ${contatti.citta}`}
            className="min-h-[340px] lg:min-h-full"
          />
        </section>
      </div>
    </>
  );
}
