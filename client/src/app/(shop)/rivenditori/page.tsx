import type { Metadata } from "next";
import { BadgePercent, Boxes, Headset, Truck } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { whatsappUrl } from "@/lib/urls";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { FeatureGrid, type Feature } from "@/components/content/FeatureGrid";
import { Steps } from "@/components/content/Steps";
import { ResellerForm } from "@/components/forms/ResellerForm";

export const metadata: Metadata = {
  title: "Diventa rivenditore",
  description:
    "Hai una cartoleria, una libreria o un negozio? Richiedi le condizioni riservate ai rivenditori di Cartoleria Bambù: listino dedicato, assortimento ampio e assistenza diretta.",
  alternates: { canonical: "/rivenditori" },
};

const BENEFITS: Feature[] = [
  {
    icon: BadgePercent,
    tone: "orange",
    title: "Condizioni riservate",
    text: "Listino dedicato ai professionisti, con condizioni pensate sui volumi della tua attività.",
  },
  {
    icon: Boxes,
    tone: "magenta",
    title: "Un assortimento ampio",
    text: "Scuola, ufficio, creatività, giochi e idee regalo: un unico fornitore per tanti reparti.",
  },
  {
    icon: Truck,
    tone: "leaf",
    title: "Spedizioni rapide",
    text: "Spediamo in tutta Italia; se sei in zona puoi anche ritirare direttamente in negozio.",
  },
  {
    icon: Headset,
    tone: "sky",
    title: "Un contatto diretto",
    text: "Parli con persone vere, anche su WhatsApp, per disponibilità, riassortimenti e novità.",
  },
];

export default async function RivenditoriPage() {
  const { contatti } = await getSettings();
  return (
    <>
      <PageHeader
        title="Diventa rivenditore"
        subtitle="Hai una cartoleria, una libreria o un negozio di giocattoli? Lavoriamo volentieri con i professionisti: scopri le condizioni a te riservate."
      />

      <div className="container space-y-14 py-10 sm:space-y-20 sm:py-14">
        <section aria-label="Perché lavorare con noi">
          <FeatureGrid items={BENEFITS} />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div className="space-y-8">
            <div>
              <span className="mb-3 block h-2 w-8 rounded-full bg-orange" aria-hidden />
              <h2 className="text-3xl font-extrabold">Come funziona</h2>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
                Tre passaggi e sei dei nostri. Ti chiediamo partita IVA e ragione sociale perché le condizioni sono riservate
                alle attività.
              </p>
            </div>
            <Steps
              stacked
              steps={[
                { title: "Invia la richiesta", text: "Compila il modulo con i dati della tua attività." },
                { title: "Ti ricontattiamo", text: "Ci conosciamo meglio e capiamo cosa ti serve." },
                { title: "Ricevi listino e condizioni", text: "E puoi iniziare a ordinare quando vuoi." },
              ]}
            />
            {contatti.whatsapp && (
              <a
                href={whatsappUrl(contatti.whatsapp, "Ciao! Ho un'attività e vorrei informazioni per diventare rivenditore")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-3xl bg-leaf-soft p-5 font-bold text-leaf-ink transition hover:shadow-card"
              >
                <WhatsAppIcon className="h-6 w-6 shrink-0" />
                <span>
                  Preferisci parlarne a voce?
                  <span className="block text-sm font-medium text-ink-soft">Scrivici su WhatsApp, ti rispondiamo noi.</span>
                </span>
              </a>
            )}
          </div>

          <section className="rounded-3xl border border-paper-line bg-white p-6 shadow-card sm:p-10" aria-label="Richiesta rivenditore">
            <ResellerForm />
          </section>
        </div>
      </div>
    </>
  );
}
