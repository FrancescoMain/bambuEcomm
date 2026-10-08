import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeEuro,
  Banknote,
  CircleX,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { getSettings } from "@/lib/api/server";
import { formatPrice, plural } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shop/PageHeader";
import { buttonClass } from "@/components/ui/Button";
import { Steps } from "@/components/content/Steps";
import { TONE, type Tone } from "@/components/content/tones";

export const metadata: Metadata = {
  title: "Spedizioni e resi",
  description:
    "Costi e tempi di spedizione, spedizione gratuita, ritiro gratis in negozio a Torre Annunziata, metodi di pagamento, resi e recesso online su Cartoleria Bambù.",
  alternates: { canonical: "/spedizioni-e-resi" },
};

function Heading({ id, title, accent, children }: { id: string; title: string; accent: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 max-w-2xl">
      <span className={cn("mb-3 block h-2 w-8 rounded-full", accent)} aria-hidden />
      <h2 id={id} className="text-2xl font-extrabold sm:text-3xl">
        {title}
      </h2>
      {children && <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{children}</p>}
    </div>
  );
}

function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5 py-4 first:pt-0 last:pb-0">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
      <div>
        <h3 className="font-bold text-ink">{label}</h3>
        <p className="mt-0.5 text-[15px] leading-relaxed text-ink-soft">{children}</p>
      </div>
    </li>
  );
}

function Tile({ icon: Icon, tone, title, text }: { icon: LucideIcon; tone: Tone; title: string; text: string }) {
  return (
    <li className={cn("rounded-3xl p-5", TONE[tone].soft)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Icon className={cn("h-5 w-5", TONE[tone].icon)} aria-hidden />
      </span>
      <p className="mt-3 text-lg font-extrabold leading-tight text-ink">{title}</p>
      <p className="mt-0.5 text-sm text-ink-soft">{text}</p>
    </li>
  );
}

export default async function SpedizioniPage() {
  const { spedizione, pagamenti, resi, contatti, azienda } = await getSettings();
  const { giornata } = spedizione;
  const contrassegno = pagamenti.contrassegno;
  const transito =
    spedizione.giorniTransitoMin === spedizione.giorniTransitoMax
      ? plural(spedizione.giorniTransitoMax, "giorno lavorativo", "giorni lavorativi")
      : `${spedizione.giorniTransitoMin}-${spedizione.giorniTransitoMax} giorni lavorativi`;

  const nav = [
    { id: "spedizione", label: "Spedizione" },
    ...(spedizione.ritiroInNegozio ? [{ id: "ritiro", label: "Ritiro in negozio" }] : []),
    ...(giornata.attivo ? [{ id: "giornata", label: "Consegna in giornata" }] : []),
    { id: "pagamenti", label: "Pagamenti" },
    { id: "resi", label: "Resi e recesso" },
    { id: "annullamento", label: "Annullare un ordine" },
  ];

  return (
    <>
      <PageHeader
        title="Spedizioni e resi"
        subtitle="Costi, tempi di consegna, ritiro in negozio, pagamenti e resi: tutto quello che c'è da sapere, in una pagina."
      >
        <nav aria-label="In questa pagina" className="mt-6 flex flex-wrap gap-2">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="rounded-full border border-paper-line bg-white px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-ink-faint hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="container space-y-16 py-10 sm:space-y-20 sm:py-14">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="In breve">
          <Tile icon={Truck} tone="orange" title={`Spedizione ${formatPrice(spedizione.costo)}`} text="Corriere espresso con tracking" />
          <Tile icon={BadgeEuro} tone="leaf" title={`Gratis da ${formatPrice(spedizione.sogliaGratuita)}`} text="Su tutti gli ordini in Italia" />
          {spedizione.ritiroInNegozio ? (
            <Tile icon={Store} tone="sky" title="Ritiro gratuito" text="In negozio a Torre Annunziata" />
          ) : (
            <Tile icon={Clock} tone="sky" title={spedizione.tempiConsegna} text="Tempi di consegna indicativi" />
          )}
          <Tile icon={RotateCcw} tone="magenta" title={`Reso entro ${resi.giorni} giorni`} text="Con il recesso online" />
        </ul>

        {/* Spedizione */}
        <section id="spedizione" className="scroll-mt-32" aria-labelledby="spedizione-titolo">
          <Heading id="spedizione-titolo" title="Spedizione a domicilio" accent="bg-orange">
            Spediamo in tutta Italia con corriere espresso: riceverai via email il numero di tracking per seguire il pacco.
          </Heading>
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="divide-y divide-paper-line rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
              <Fact icon={Truck} label="Costo">
                {formatPrice(spedizione.costo)} per ordine, qualunque sia il numero di articoli.
              </Fact>
              <Fact icon={BadgeEuro} label="Spedizione gratuita">
                Per ordini da {formatPrice(spedizione.sogliaGratuita)} in su: il carrello ti dice quanto manca.
              </Fact>
              <Fact icon={Clock} label="Tempi di consegna">
                {spedizione.tempiConsegna} in media. Prepariamo il pacco entro{" "}
                {plural(spedizione.giorniLavorazione, "giorno lavorativo", "giorni lavorativi")}, poi il corriere consegna
                in {transito}.
              </Fact>
              <Fact icon={PackageCheck} label="Tracking">
                Quando il pacco parte ti inviamo un&apos;email con il numero di spedizione; lo trovi anche in{" "}
                <Link href="/account/ordini" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2">
                  I miei ordini
                </Link>
                .
              </Fact>
            </ul>
            <div className="rounded-3xl bg-paper-warm p-6 sm:p-8">
              <h3 className="text-lg font-extrabold">Dal clic alla porta di casa</h3>
              <ol className="mt-5 space-y-5">
                {[
                  { title: "Ordini sul sito", text: "Ricevi subito l'email di conferma con il riepilogo." },
                  {
                    title: "Prepariamo il pacco",
                    text: `Entro ${plural(spedizione.giorniLavorazione, "giorno lavorativo", "giorni lavorativi")}, con cura e protezioni adatte.`,
                  },
                  { title: "Il corriere è in viaggio", text: `Consegna in ${transito}, con tracking via email.` },
                  { title: "Arriva a casa tua", text: "Controlla il pacco alla consegna: se è danneggiato, segnalalo al corriere e a noi." },
                ].map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-orange-ink shadow-sm"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold">{s.title}</p>
                      <p className="text-[15px] text-ink-soft">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Ritiro in negozio */}
        {spedizione.ritiroInNegozio && (
          <section id="ritiro" className="scroll-mt-32" aria-labelledby="ritiro-titolo">
            <Heading id="ritiro-titolo" title="Ritiro gratuito in negozio" accent="bg-sky">
              Abiti in zona o passi da Torre Annunziata? Scegli &quot;Ritiro in negozio&quot; al checkout: non paghi la
              spedizione e ritiri quando ti è più comodo.
            </Heading>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Steps
                steps={[
                  { title: "Scegli il ritiro", text: "Al checkout seleziona “Ritiro in negozio”: è gratis." },
                  { title: "Ti avvisiamo noi", text: "Ricevi un'email appena l'ordine è pronto da ritirare." },
                  { title: "Passa in negozio", text: "Negli orari di apertura, con il numero d'ordine." },
                ]}
              />
              <div className="rounded-3xl border border-paper-line bg-white p-6">
                <p className="flex items-start gap-2.5 font-bold">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                  <span>
                    {contatti.indirizzo}
                    <span className="block font-normal text-ink-soft">{contatti.citta}</span>
                  </span>
                </p>
                {contatti.orari.length > 0 && (
                  <dl className="mt-4 space-y-1.5 border-t border-paper-line pt-4 text-sm">
                    {contatti.orari.map((o) => (
                      <div key={o.giorni} className="flex flex-wrap justify-between gap-x-3">
                        <dt className="font-semibold">{o.giorni}</dt>
                        <dd className="text-ink-soft">{o.orario}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <Link href="/contatti#negozio" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
                  Mappa e indicazioni <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Consegna in giornata */}
        {giornata.attivo && (
          <section
            id="giornata"
            className="scroll-mt-32 grid items-center gap-6 rounded-3xl bg-ink p-6 text-white sm:p-10 lg:grid-cols-[1fr_auto]"
            aria-labelledby="giornata-titolo"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 text-orange" aria-hidden /> Super veloce
              </span>
              <h2 id="giornata-titolo" className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
                Consegna in giornata
              </h2>
              <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-white/75">
                {giornata.descrizione ||
                  `Ordina entro le ${giornata.orarioLimite} e ricevi tutto in giornata.`}{" "}
                Costo {formatPrice(giornata.costo)}, ordini entro le {giornata.orarioLimite} (dal lunedì al sabato).
              </p>
              {giornata.cap.length > 0 && (
                <p className="mt-4 text-sm text-white/70">
                  Disponibile per i CAP:{" "}
                  {giornata.cap.map((cap) => (
                    <span key={cap} className="mr-1.5 inline-block rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold text-white">
                      {cap}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <p className="text-4xl font-extrabold text-white sm:text-5xl">{formatPrice(giornata.costo)}</p>
          </section>
        )}

        {/* Pagamenti */}
        <section id="pagamenti" className="scroll-mt-32" aria-labelledby="pagamenti-titolo">
          <Heading id="pagamenti-titolo" title="Metodi di pagamento" accent="bg-magenta">
            Paghi in modo sicuro tramite Stripe: i dati della tua carta non passano mai dai nostri server.
          </Heading>
          <ul className={cn("grid gap-4 sm:grid-cols-2", contrassegno.attivo ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
            <li className="rounded-3xl border border-paper-line bg-white p-6">
              <CreditCard className="h-6 w-6 text-magenta" aria-hidden />
              <h3 className="mt-3 font-extrabold">Carte di credito e debito</h3>
              <p className="mt-1 text-sm text-ink-soft">Visa, Mastercard, Maestro e American Express, anche prepagate.</p>
            </li>
            <li className="rounded-3xl border border-paper-line bg-white p-6">
              <Smartphone className="h-6 w-6 text-magenta" aria-hidden />
              <h3 className="mt-3 font-extrabold">Apple Pay e Google Pay</h3>
              <p className="mt-1 text-sm text-ink-soft">Paghi in un tocco dal telefono, senza digitare i dati della carta.</p>
            </li>
            {contrassegno.attivo && (
              <li className="rounded-3xl border border-paper-line bg-white p-6">
                <Banknote className="h-6 w-6 text-magenta" aria-hidden />
                <h3 className="mt-3 font-extrabold">Contrassegno</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Paghi al corriere alla consegna
                  {contrassegno.commissione > 0 ? `, con una commissione di ${formatPrice(contrassegno.commissione)}` : ""}.
                </p>
              </li>
            )}
            <li className="rounded-3xl border border-paper-line bg-white p-6">
              <FileText className="h-6 w-6 text-magenta" aria-hidden />
              <h3 className="mt-3 font-extrabold">Fattura</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Ti serve la fattura? Richiedila al checkout indicando i dati di fatturazione.
              </p>
            </li>
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> Pagamenti protetti con autenticazione 3D Secure.
          </p>
        </section>

        {/* Resi e recesso */}
        <section id="resi" className="scroll-mt-32" aria-labelledby="resi-titolo">
          <Heading id="resi-titolo" title="Resi e diritto di recesso" accent="bg-leaf" />
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl bg-brand-50 p-6 sm:p-10">
              <p className="text-3xl font-extrabold sm:text-4xl">
                Hai {resi.giorni} giorni per ripensarci
              </p>
              {resi.testo && <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{resi.testo}</p>}
              <Link href="/recesso" className={buttonClass("primary", "lg", "mt-7 w-full sm:w-auto")}>
                <RotateCcw className="h-5 w-5" aria-hidden /> Avvia il recesso online
              </Link>
              <p className="mt-3 text-sm text-ink-muted">Bastano numero d&apos;ordine ed email: ci vogliono due minuti.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-paper-line bg-white p-6">
                <h3 className="flex items-center gap-2 font-extrabold">
                  <RotateCcw className="h-5 w-5 text-leaf" aria-hidden /> Come funziona il reso
                </h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] text-ink-soft marker:font-bold marker:text-ink">
                  <li>Compila il modulo di recesso online: ricevi subito la conferma via email.</li>
                  <li>
                    Spedisci i prodotti, integri e nella confezione originale, entro 14 giorni a: {azienda.ragioneSociale},{" "}
                    {contatti.indirizzo}, {contatti.citta}.
                  </li>
                  <li>Ti rimborsiamo entro 14 giorni, con lo stesso metodo di pagamento usato per l&apos;ordine.</li>
                </ol>
              </div>
              <div className="rounded-3xl border border-paper-line bg-white p-6">
                <h3 className="flex items-center gap-2 font-extrabold">
                  <Wrench className="h-5 w-5 text-sky" aria-hidden /> Prodotto difettoso o danneggiato?
                </h3>
                <p className="mt-2 text-[15px] text-ink-soft">
                  Vale la garanzia legale di conformità di 24 mesi: scrivici con il numero d&apos;ordine e qualche foto e
                  troviamo insieme la soluzione (riparazione, sostituzione o rimborso), senza costi per te.
                </p>
                <Link href="/contatti" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
                  Contattaci <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Annullamento */}
        <section
          id="annullamento"
          className="scroll-mt-32 flex flex-col gap-5 rounded-3xl border border-paper-line bg-white p-6 sm:flex-row sm:items-center sm:p-8"
          aria-labelledby="annullamento-titolo"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-magenta-soft text-magenta">
            <CircleX className="h-7 w-7" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 id="annullamento-titolo" className="text-xl font-extrabold">
              Hai cambiato idea subito dopo l&apos;ordine?
            </h2>
            <p className="mt-1 text-[15px] text-ink-soft">
              Puoi annullarlo da solo entro 24 ore da <strong className="text-ink">I miei ordini</strong>, se non è ancora
              stato spedito: il rimborso parte in automatico. Hai ordinato senza account? Scrivici e ci pensiamo noi.
            </p>
          </div>
          <Link href="/account/ordini" className={buttonClass("outline", "md", "shrink-0")}>
            I miei ordini
          </Link>
        </section>
      </div>
    </>
  );
}
