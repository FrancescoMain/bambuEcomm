import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Ban, CalendarClock, PackageOpen, Wallet } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { whatsappUrl } from "@/lib/urls";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { Skeleton } from "@/components/ui/Spinner";
import { RecessoWizard } from "@/components/forms/RecessoWizard";

export const metadata: Metadata = {
  title: "Recesso online",
  description:
    "Recedi da un acquisto su Cartoleria Bambù in tre passaggi: numero d'ordine, articoli da restituire e conferma. Hai 14 giorni dalla consegna e il rimborso arriva entro 14 giorni.",
  alternates: { canonical: "/recesso" },
};

export default async function RecessoPage() {
  const { resi, azienda, contatti } = await getSettings();
  const indirizzoReso = `${azienda.ragioneSociale}, ${contatti.indirizzo}, ${contatti.citta}`;

  const points = [
    {
      icon: CalendarClock,
      title: `${resi.giorni} giorni per ripensarci`,
      text: `Puoi recedere dall'acquisto entro ${resi.giorni} giorni dal giorno in cui ricevi i prodotti, senza indicarne il motivo e senza penali.`,
    },
    {
      icon: PackageOpen,
      title: "Come restituire i prodotti",
      text: `Spediscili integri, completi e possibilmente nella confezione originale entro 14 giorni dalla richiesta a: ${indirizzoReso}. Le spese di restituzione sono a tuo carico.`,
    },
    {
      icon: Wallet,
      title: "Rimborso entro 14 giorni",
      text: "Ti rimborsiamo entro 14 giorni dalla ricezione della richiesta, con lo stesso metodo di pagamento e senza costi aggiuntivi. Il rimborso può essere sospeso fino al ricevimento dei prodotti o della prova della spedizione.",
    },
    {
      icon: Ban,
      title: "Cosa è escluso",
      text: "I prodotti personalizzati o realizzati su misura (art. 59 del Codice del Consumo).",
    },
  ];

  return (
    <>
      <PageHeader
        title="Recesso online"
        subtitle={`Hai cambiato idea? Hai ${resi.giorni} giorni dalla consegna per restituire i prodotti. Compila il modulo in tre passaggi: ti inviamo subito la conferma via email.`}
        crumbs={[{ label: "Spedizioni e resi", href: "/spedizioni-e-resi" }, { label: "Recesso online" }]}
      />

      <div className="container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0 space-y-6 lg:self-start">
          <section className="rounded-3xl border border-paper-line bg-white p-6 shadow-card sm:p-10" aria-label="Modulo di recesso">
            <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
              <RecessoWizard giorni={resi.giorni} indirizzoReso={indirizzoReso} />
            </Suspense>
          </section>

          <div className="rounded-3xl border border-paper-line bg-white p-6">
            <h2 className="font-extrabold">Non trovi il numero d&apos;ordine?</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              È nell&apos;email di conferma che ti abbiamo inviato dopo l&apos;acquisto. Se hai un account lo trovi anche in{" "}
              <Link href="/account/ordini" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2">
                I miei ordini
              </Link>
              .
            </p>
            {contatti.whatsapp && (
              <a
                href={whatsappUrl(contatti.whatsapp, "Ciao! Ho bisogno di aiuto con un reso")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline"
              >
                <WhatsAppIcon className="h-4 w-4 text-[#1faa53]" /> Chiedi aiuto su WhatsApp
              </a>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-3xl bg-paper-warm p-6 sm:p-7">
            <h2 className="text-xl font-extrabold">Il diritto di recesso in breve</h2>
            <ul className="mt-5 space-y-5">
              {points.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-paper-line pt-4 text-xs leading-relaxed text-ink-muted">
              Riferimenti: artt. 52-59 del D.Lgs. 206/2005 (Codice del Consumo). Condizioni complete nei{" "}
              <Link href="/terms" className="font-semibold underline underline-offset-2 hover:text-ink">
                termini e condizioni
              </Link>{" "}
              e in{" "}
              <Link href="/spedizioni-e-resi#resi" className="font-semibold underline underline-offset-2 hover:text-ink">
                spedizioni e resi
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
