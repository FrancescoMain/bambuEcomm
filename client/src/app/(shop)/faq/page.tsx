import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, CreditCard, MessageCircle, Package, Phone, RotateCcw, Truck, type LucideIcon } from "lucide-react";
import { getSettings } from "@/lib/api/server";
import type { StoreSettings } from "@/lib/types";
import { whatsappUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shop/PageHeader";
import { WhatsAppIcon } from "@/components/shop/icons";
import { AccordionItem } from "@/components/ui/Accordion";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpLinks } from "@/components/content/HelpLinks";
import { JsonLd } from "@/components/content/JsonLd";
import { TONE, telHref, type Tone } from "@/components/content/tones";

export const metadata: Metadata = {
  title: "Domande frequenti",
  description:
    "Spedizioni, ritiro in negozio, pagamenti, resi e ordini: le risposte alle domande più frequenti su Cartoleria Bambù.",
  alternates: { canonical: "/faq" },
};

type Faq = StoreSettings["faq"][number];
type Group = { id: string; title: string; icon: LucideIcon; tone: Tone; match?: RegExp; items: Faq[] };

// Le FAQ arrivano dal pannello come lista unica: le raggruppiamo per argomento
const groupFaqs = (faqs: Faq[]): Group[] => {
  const groups: Group[] = [
    { id: "spedizioni", title: "Spedizioni e ritiro", icon: Truck, tone: "orange", match: /spedi|consegn|ritir|tracking|corrier|pacco/i, items: [] },
    { id: "pagamenti", title: "Pagamenti", icon: CreditCard, tone: "sky", match: /pagament|pagare|carta|contrassegno|fattur|apple pay|google pay/i, items: [] },
    { id: "resi", title: "Resi e rimborsi", icon: RotateCcw, tone: "magenta", match: /restitu|\breso\b|\bresi\b|recesso|rimbors|cambi|difett|garanzi/i, items: [] },
    { id: "ordini", title: "Ordini e account", icon: Package, tone: "leaf", match: /ordin|account|annull|modific|registr|password/i, items: [] },
    { id: "altro", title: "Altre domande", icon: CircleHelp, tone: "brand", items: [] },
  ];
  for (const faq of faqs) {
    const target =
      groups.find((g) => g.match?.test(faq.domanda)) ??
      groups.find((g) => g.match?.test(faq.risposta)) ??
      groups[groups.length - 1];
    target.items.push(faq);
  }
  return groups.filter((g) => g.items.length);
};

export default async function FaqPage() {
  const { faq, contatti } = await getSettings();
  const faqs = faq.filter((f) => f.domanda?.trim() && f.risposta?.trim());
  const groups = groupFaqs(faqs);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.domanda,
      acceptedAnswer: { "@type": "Answer", text: f.risposta },
    })),
  };

  return (
    <>
      {faqs.length > 0 && <JsonLd data={jsonLd} />}
      <PageHeader
        title="Domande frequenti"
        subtitle="Spedizioni, pagamenti, resi e ordini: qui trovi le risposte più rapide. Se manca qualcosa, chiedi pure!"
      >
        {groups.length > 1 && (
          <nav aria-label="Argomenti" className="mt-6 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-paper-line bg-white px-4 py-2 text-sm font-bold text-ink-soft transition hover:border-ink-faint hover:text-ink"
              >
                <g.icon className={cn("h-4 w-4", TONE[g.tone].icon)} aria-hidden />
                {g.title}
              </a>
            ))}
          </nav>
        )}
      </PageHeader>

      <div className="container grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_340px] lg:gap-14">
        <div className="min-w-0 space-y-10">
          {groups.length === 0 && (
            <EmptyState
              icon={<CircleHelp className="h-7 w-7" aria-hidden />}
              title="Le domande frequenti stanno arrivando"
              text="Nel frattempo scrivici: ti rispondiamo il prima possibile."
              action={
                <Link href="/contatti" className={buttonClass("primary")}>
                  Contattaci
                </Link>
              }
              className="rounded-3xl border border-dashed border-paper-line bg-white"
            />
          )}
          {groups.map((g, gi) => (
            <section key={g.id} id={g.id} className="scroll-mt-32" aria-labelledby={`${g.id}-titolo`}>
              <div className="mb-4 flex items-center gap-3">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", TONE[g.tone].soft)}>
                  <g.icon className={cn("h-5 w-5", TONE[g.tone].icon)} aria-hidden />
                </span>
                <h2 id={`${g.id}-titolo`} className="text-2xl font-extrabold">
                  {g.title}
                </h2>
              </div>
              <div className="rounded-3xl border border-paper-line bg-white px-5 sm:px-7">
                {g.items.map((f, i) => (
                  <AccordionItem
                    key={f.domanda}
                    title={<span className="text-[16px] leading-snug">{f.domanda}</span>}
                    defaultOpen={gi === 0 && i === 0}
                    className="last:border-b-0"
                  >
                    <p className="whitespace-pre-line">{f.risposta}</p>
                  </AccordionItem>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-3xl bg-brand-50 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <MessageCircle className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-extrabold">Non hai trovato la risposta?</h2>
            <p className="mt-1 text-[15px] text-ink-soft">Chiedi direttamente a noi: siamo persone vere, in negozio.</p>
            <div className="mt-5 grid gap-2">
              {contatti.whatsapp && (
                <a
                  href={whatsappUrl(contatti.whatsapp, "Ciao! Ho una domanda")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "md", "w-full")}
                >
                  <WhatsAppIcon className="h-5 w-5" /> Scrivici su WhatsApp
                </a>
              )}
              {contatti.telefono && (
                <a href={telHref(contatti.telefono)} className={buttonClass("outline", "md", "w-full")}>
                  <Phone className="h-4 w-4" aria-hidden /> {contatti.telefono}
                </a>
              )}
              <Link href="/contatti" className={buttonClass("ghost", "md", "w-full")}>
                Tutti i contatti
              </Link>
            </div>
          </div>
          <HelpLinks exclude={["/faq", "/contatti"]} compact />
        </aside>
      </div>
    </>
  );
}
