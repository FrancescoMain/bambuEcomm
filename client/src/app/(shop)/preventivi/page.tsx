import type { Metadata } from "next";
import { Backpack, Briefcase, FileText, ListChecks, Store, Users } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { whatsappUrl } from "@/lib/urls";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { FeatureGrid, type Feature } from "@/components/content/FeatureGrid";
import { Steps } from "@/components/content/Steps";
import { QuoteForm } from "@/components/forms/QuoteForm";

export const metadata: Metadata = {
  title: "Ordini per scuole, uffici e associazioni",
  description:
    "Forniture scolastiche, liste di classe e cancelleria per uffici: richiedi a Cartoleria Bambù un preventivo gratuito su misura per scuole, aziende, enti e associazioni.",
  alternates: { canonical: "/preventivi" },
};

const SERVIZI: Feature[] = [
  {
    icon: Backpack,
    tone: "orange",
    title: "Forniture scolastiche",
    text: "Quaderni, colori, materiale didattico e di consumo per scuole e insegnanti, anche in grandi quantità.",
  },
  {
    icon: ListChecks,
    tone: "magenta",
    title: "Liste di classe",
    text: "Mandaci la lista dei materiali: prepariamo i kit per tutta la classe, pronti da consegnare.",
  },
  {
    icon: Briefcase,
    tone: "sky",
    title: "Cancelleria per uffici",
    text: "Penne, carta, archiviazione e accessori per la scrivania, con riordini semplici quando servono.",
  },
  {
    icon: Users,
    tone: "leaf",
    title: "Associazioni ed eventi",
    text: "Gadget, materiale per laboratori e piccoli regali per feste, centri estivi e iniziative.",
  },
];

export default async function PreventiviPage() {
  const { contatti, spedizione } = await getSettings();
  return (
    <>
      <PageHeader
        title="Ordini per scuole, uffici e associazioni"
        subtitle="Forniture scolastiche, liste di classe e cancelleria per l'ufficio: ti prepariamo un preventivo su misura, gratuito e senza impegno."
        crumbs={[{ label: "Preventivi" }]}
      />

      <div className="container space-y-14 py-10 sm:space-y-20 sm:py-14">
        <section aria-label="Cosa possiamo fare per te">
          <FeatureGrid items={SERVIZI} />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div className="space-y-8">
            <div>
              <span className="mb-3 block h-2 w-8 rounded-full bg-sky" aria-hidden />
              <h2 className="text-3xl font-extrabold">Come funziona</h2>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
                Raccontaci di cosa hai bisogno: ti rispondiamo con una proposta chiara su prezzi, disponibilità e tempi.
              </p>
            </div>
            <Steps
              stacked
              steps={[
                { title: "Descrivi la richiesta", text: "Prodotti, quantità, budget e quando ti servono." },
                { title: "Ricevi il preventivo", text: "Con prezzi dedicati e alternative, se utili." },
                {
                  title: spedizione.ritiroInNegozio ? "Consegna o ritiro" : "Consegna",
                  text: spedizione.ritiroInNegozio
                    ? "Spediamo dove ti serve oppure ritiri tutto in negozio."
                    : "Spediamo dove ti serve, in tutta Italia.",
                },
              ]}
            />
            <ul className="space-y-3 text-[15px] text-ink-soft">
              <li className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                Emettiamo fattura per scuole, enti, aziende e associazioni.
              </li>
              {spedizione.ritiroInNegozio && (
                <li className="flex items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                  Ritiro gratuito in negozio a Torre Annunziata.
                </li>
              )}
              {contatti.whatsapp && (
                <li className="flex items-start gap-3">
                  <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#1faa53]" />
                  <span>
                    Hai già la lista in foto?{" "}
                    <a
                      href={whatsappUrl(contatti.whatsapp, "Ciao! Vorrei un preventivo per questa lista:")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
                    >
                      Inviacela su WhatsApp
                    </a>
                    .
                  </span>
                </li>
              )}
            </ul>
          </div>

          <section className="rounded-3xl border border-paper-line bg-white p-6 shadow-card sm:p-10" aria-label="Richiesta di preventivo">
            <QuoteForm />
          </section>
        </div>
      </div>
    </>
  );
}
