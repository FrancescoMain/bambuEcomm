import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Gift, MapPin, PencilLine, Scissors, Sparkles, Store, Truck } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/urls";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeatureGrid, type Feature } from "@/components/content/FeatureGrid";
import { StoreInfoCard } from "@/components/content/StoreInfoCard";
import { CtaBand, ctaGhostClass, ctaLightClass } from "@/components/content/CtaBand";

const FOUNDED = 2016;

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Dal 2016 Cartoleria Bambù è la cartoleria di Torre Annunziata per scuola, ufficio, creatività e regali. Scopri la nostra storia, il negozio in Corso Umberto I e come lavoriamo.",
  alternates: { canonical: "/chi-siamo" },
};

const VALUES: Feature[] = [
  {
    icon: BookOpen,
    tone: "orange",
    title: "Scuola",
    text: "Quaderni, zaini, astucci e diari: tutto per il rientro in classe, scelto pezzo per pezzo con chi lo userà ogni giorno.",
  },
  {
    icon: PencilLine,
    tone: "magenta",
    title: "Ufficio",
    text: "Penne, agende, archiviazione e cancelleria per chi lavora: prodotti affidabili, sempre disponibili.",
  },
  {
    icon: Scissors,
    tone: "leaf",
    title: "Creatività",
    text: "Colori, pennarelli, carta e materiali per disegnare e creare: l'angolo preferito di chi ama fare con le mani.",
  },
  {
    icon: Gift,
    tone: "sky",
    title: "Regali",
    text: "Giochi, gadget e piccoli pensieri per ogni occasione, con un consiglio in più quando serve un'idea.",
  },
];

const PHOTOS = [
  {
    src: "/negozio/parete-zaini.webp",
    alt: "La parete degli zaini nel negozio Cartoleria Bambù",
    caption: "La parete degli zaini",
    row: "md:row-start-1",
  },
  {
    src: "/negozio/espositore-posca.webp",
    alt: "L'espositore dei pennarelli Posca in negozio",
    caption: "L'angolo dei colori",
    row: "md:row-start-2",
  },
];

export default async function ChiSiamoPage() {
  const { contatti, spedizione } = await getSettings();
  const anni = new Date().getFullYear() - FOUNDED;

  return (
    <>
      <PageHeader
        title="Chi siamo"
        subtitle={`Dal ${FOUNDED} la cartoleria di Torre Annunziata: scuola, ufficio, creatività e regali, con un consiglio sempre pronto.`}
      />

      <div className="container space-y-16 py-12 sm:space-y-24 sm:py-16">
        {/* La nostra storia */}
        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16" aria-labelledby="storia">
          <div>
            <span className="mb-3 block h-2 w-8 rounded-full bg-orange" aria-hidden />
            <h2 id="storia" className="text-3xl font-extrabold sm:text-4xl">
              Una cartoleria di quartiere, dal {FOUNDED}
            </h2>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-soft">
              <p>
                Cartoleria Bambù nasce nel {FOUNDED} a Torre Annunziata dalla passione per la scrittura, la creatività
                e tutto quello che rende speciali i momenti di studio e di lavoro.
              </p>
              <p>
                Quello che era un sogno è diventato un punto di riferimento per studenti, famiglie, professionisti e
                appassionati di cartoleria: un negozio dove si entra per un quaderno e si esce con un&apos;idea in più.
              </p>
              <p>
                Oggi ci trovi in Corso Umberto I e anche online, con spedizioni in tutta Italia. I valori sono rimasti
                gli stessi: prodotti di qualità, attenzione a ogni cliente e la cura di chi conosce bene quello che vende.
              </p>
            </div>
            <ul className="mt-7 flex flex-wrap gap-2">
              {[
                { icon: Sparkles, text: `Dal ${FOUNDED}` },
                { icon: MapPin, text: "Torre Annunziata" },
                { icon: Truck, text: "Spedizioni in tutta Italia" },
                ...(spedizione.ritiroInNegozio ? [{ icon: Store, text: "Ritiro gratis in negozio" }] : []),
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-paper-line bg-white px-3.5 py-2 text-sm font-semibold text-ink-soft"
                >
                  <Icon className="h-4 w-4 text-brand-600" aria-hidden /> {text}
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-brand-50 bg-confetti">
              <span className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-orange/85" aria-hidden />
              <span className="absolute right-10 top-8 h-8 w-8 rounded-full bg-magenta" aria-hidden />
              <span className="absolute -bottom-12 right-16 h-36 w-36 rounded-full bg-sky/75" aria-hidden />
              <span className="absolute bottom-10 left-16 h-6 w-6 rounded-full bg-leaf" aria-hidden />
              <span className="relative -rotate-3 rounded-[2rem] bg-white p-6 shadow-lift sm:p-8">
                <Image
                  src="/logo-panda.png"
                  alt="Il logo della Cartoleria Bambù: il panda con il libro, la matita, le forbici e il regalo"
                  width={1034}
                  height={792}
                  priority
                  sizes="(min-width: 640px) 288px, 208px"
                  className="h-auto w-52 sm:w-72"
                />
              </span>
            </div>
            <figcaption className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white p-4 pr-6 shadow-lift sm:left-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-soft text-xl font-extrabold text-orange-ink">
                {anni}
              </span>
              <span className="text-sm leading-tight">
                <span className="block font-extrabold text-ink">anni di cartoleria</span>
                <span className="text-ink-muted">in Corso Umberto I</span>
              </span>
            </figcaption>
          </figure>
        </section>

        {/* I quattro mondi del logo */}
        <section aria-labelledby="valori">
          <div className="mb-8 max-w-2xl">
            <span className="mb-3 flex gap-1.5" aria-hidden>
              <span className="h-2 w-8 rounded-full bg-orange" />
              <span className="h-2 w-8 rounded-full bg-magenta" />
              <span className="h-2 w-8 rounded-full bg-leaf" />
              <span className="h-2 w-8 rounded-full bg-sky" />
            </span>
            <h2 id="valori" className="text-3xl font-extrabold sm:text-4xl">
              Quattro passioni, un solo negozio
            </h2>
            <p className="mt-3 text-[17px] text-ink-muted">
              Il libro, la matita, le forbici e il regalo del nostro logo raccontano quello che facciamo ogni giorno.
            </p>
          </div>
          <FeatureGrid items={VALUES} />
        </section>

        {/* Il negozio in foto */}
        <section aria-label="Il negozio in foto">
          <SectionHeading
            title="Il negozio"
            subtitle="Scaffali pieni di colori, zaini, penne e idee: passa a trovarci."
            accent="bg-leaf"
            className="mb-8"
          />
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3 md:grid-rows-2">
            {PHOTOS.map((p) => (
              <figure
                key={p.src}
                className={`group relative aspect-[3/2] overflow-hidden rounded-3xl bg-paper-warm md:col-span-2 md:aspect-auto md:min-h-[260px] ${p.row}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 66vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-bold text-ink backdrop-blur">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
            <figure className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-paper-warm md:col-start-3 md:row-span-2 md:row-start-1 md:aspect-auto">
              <Image
                src="/negozio/soppalco.webp"
                alt="Il soppalco della Cartoleria Bambù con scaffali di cancelleria"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-bold text-ink backdrop-blur">
                Il soppalco
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Dove trovarci */}
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8" aria-label="Dove trovarci">
          <StoreInfoCard contatti={contatti} title="Vieni a trovarci" />
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-50 p-6 sm:p-8">
            <div>
              <span className="mb-3 block h-2 w-8 rounded-full bg-brand-400" aria-hidden />
              <h2 className="text-2xl font-extrabold sm:text-3xl">Ordina online, ritira in negozio</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">
                {spedizione.ritiroInNegozio
                  ? "Scegli i prodotti sul sito e passa a ritirarli gratis quando ti è più comodo: ti avvisiamo noi quando l'ordine è pronto."
                  : "Scegli i prodotti sul sito e ricevili comodamente a casa, in tutta Italia."}{" "}
                Hai un dubbio su un prodotto o una disponibilità? Scrivici su WhatsApp, ti rispondiamo noi.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  spedizione.ritiroInNegozio ? "Ritiro gratuito, senza costi di spedizione" : "Spedizione con corriere espresso e tracking",
                  `Spedizione gratuita da ${formatPrice(spedizione.sogliaGratuita)}`,
                  "Pagamenti sicuri con carta, Apple Pay e Google Pay",
                  "Consigli su misura, in negozio e su WhatsApp",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px] font-semibold text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/prodotti"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-600 px-6 text-[15px] font-bold text-white transition hover:bg-brand-700"
              >
                Vai allo shop <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {contatti.whatsapp && (
                <a
                  href={whatsappUrl(contatti.whatsapp, "Ciao! Vorrei sapere se avete disponibile...")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-paper-line bg-white px-6 text-[15px] font-semibold text-ink transition hover:border-ink-faint"
                >
                  <WhatsAppIcon className="h-5 w-5 text-[#1faa53]" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        <CtaBand
          title="Pronti a riempire lo zaino?"
          text="Quaderni, zaini, penne, colori e idee regalo ti aspettano online e in negozio."
        >
          <Link href="/prodotti" className={ctaLightClass}>
            Esplora i prodotti <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/novita" className={ctaGhostClass}>
            Le novità
          </Link>
        </CtaBand>
      </div>
    </>
  );
}
