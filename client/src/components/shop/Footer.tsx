import Link from "next/link";
import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { CategoryNode, StoreSettings } from "@/lib/types";
import { categoryPath, whatsappUrl } from "@/lib/urls";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "./icons";

const PAYMENTS = ["Visa", "Mastercard", "Maestro", "Amex", "Apple Pay", "Google Pay"];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-ink">{title}</h3>
      <ul className="space-y-2.5 text-[15px] text-ink-muted">{children}</ul>
    </div>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition hover:text-brand-600">
        {children}
      </Link>
    </li>
  );
}

export function Footer({ tree, settings }: { tree: CategoryNode[]; settings: StoreSettings }) {
  const { contatti, social, azienda } = settings;
  return (
    <footer className="mt-20 print:hidden">
      {/* Newsletter */}
      <section className="bg-ink text-white">
        <div className="container grid items-center gap-6 py-10 md:grid-cols-2 md:py-12">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Resta aggiornato con Bambù</h2>
            <p className="mt-2 max-w-md text-white/70">
              Novità, offerte riservate e idee per scuola e ufficio. Niente spam, promesso.
            </p>
          </div>
          <NewsletterForm dark />
        </div>
      </section>

      <div className="border-t border-paper-line bg-white">
        <div className="container grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-[15px] text-ink-muted">
              La cartoleria di Torre Annunziata dal 2016: quaderni, zaini, cancelleria, giochi e idee regalo. Ordina
              online o vieni a trovarci in negozio.
            </p>
            <ul className="mt-5 space-y-2.5 text-[15px] text-ink-soft">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <a href={contatti.mappaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">
                  {contatti.indirizzo}, {contatti.citta}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <a href={`tel:${contatti.telefono.replace(/\s/g, "")}`} className="hover:text-brand-600">
                  {contatti.telefono}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <a href={`mailto:${contatti.email}`} className="hover:text-brand-600">
                  {contatti.email}
                </a>
              </li>
              {contatti.orari.length > 0 && (
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>
                    {contatti.orari.map((o) => (
                      <span key={o.giorni} className="block">
                        <span className="font-semibold">{o.giorni}:</span> {o.orario}
                      </span>
                    ))}
                  </span>
                </li>
              )}
            </ul>
            <div className="mt-5 flex gap-2">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full bg-paper-warm p-2.5 text-ink-soft hover:bg-magenta-soft hover:text-magenta-ink">
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="rounded-full bg-paper-warm p-2.5 text-ink-soft hover:bg-ink hover:text-white">
                  <TikTokIcon className="h-4 w-4" />
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-paper-warm p-2.5 text-ink-soft hover:bg-sky-soft hover:text-sky-ink">
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
              <a href={whatsappUrl(contatti.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full bg-paper-warm p-2.5 text-ink-soft hover:bg-brand-50 hover:text-brand-700">
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <Column title="Acquista">
            {tree.map((c) => (
              <FLink key={c.id} href={categoryPath(c)}>
                {c.name}
              </FLink>
            ))}
            <FLink href="/offerte">Offerte</FLink>
            <FLink href="/novita">Novità</FLink>
            <FLink href="/prodotti">Tutti i prodotti</FLink>
          </Column>

          <Column title="Assistenza">
            <FLink href="/spedizioni-e-resi">Spedizioni e resi</FLink>
            <FLink href="/recesso">Recedi dal contratto qui</FLink>
            <FLink href="/faq">Domande frequenti</FLink>
            <FLink href="/contatti">Contatti</FLink>
            <FLink href="/account/ordini">I miei ordini</FLink>
          </Column>

          <Column title="Bambù">
            <FLink href="/chi-siamo">Chi siamo</FLink>
            <FLink href="/contatti#negozio">Il negozio</FLink>
            <FLink href="/blog">Blog</FLink>
            <FLink href="/preventivi">Ordini per scuole e uffici</FLink>
            <FLink href="/rivenditori">Diventa rivenditore</FLink>
          </Column>
        </div>

        <div className="border-t border-paper-line">
          <div className="container flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              <span className="mr-1 text-sm font-semibold text-ink-soft">Pagamenti sicuri</span>
              {PAYMENTS.map((p) => (
                <span key={p} className="rounded-md border border-paper-line bg-paper px-2 py-1 text-[11px] font-bold text-ink-soft">
                  {p}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
              <Link href="/privacy" className="hover:text-ink">Privacy</Link>
              <Link href="/cookies" className="hover:text-ink">Cookie</Link>
              <Link href="/terms" className="hover:text-ink">Termini e condizioni</Link>
              <Link href="/mappa-del-sito" className="hover:text-ink">Mappa del sito</Link>
            </div>
          </div>
          <p className="container pb-8 text-xs text-ink-faint">
            © {new Date().getFullYear()} {azienda.ragioneSociale}
            {azienda.partitaIva ? ` · P.IVA ${azienda.partitaIva}` : ""} · {contatti.indirizzo}, {contatti.citta}
          </p>
        </div>
      </div>
    </footer>
  );
}
