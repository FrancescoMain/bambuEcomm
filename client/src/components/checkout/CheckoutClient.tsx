"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Banknote, CreditCard, Lock, Store, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import type { Order, PaymentMethod, ShippingMethod, StoreSettings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button, buttonClass } from "@/components/ui/Button";
import { Checkbox, Honeypot, Input, Textarea } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { CouponField } from "./CouponField";
import { OrderTotals } from "./OrderSummary";

type Form = {
  email: string;
  nome: string;
  cognome: string;
  telefono: string;
  via: string;
  numero: string;
  cap: string;
  citta: string;
  provincia: string;
  note: string;
  richiestaFattura: boolean;
  ragioneSociale: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceSdi: string;
  pec: string;
};

const EMPTY: Form = {
  email: "",
  nome: "",
  cognome: "",
  telefono: "",
  via: "",
  numero: "",
  cap: "",
  citta: "",
  provincia: "",
  note: "",
  richiestaFattura: false,
  ragioneSociale: "",
  partitaIva: "",
  codiceFiscale: "",
  codiceSdi: "",
  pec: "",
};

const STORAGE_KEY = "bambu-checkout-form";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-extrabold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({
  checked,
  onChange,
  icon: Icon,
  title,
  hint,
  price,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  icon: typeof Truck;
  title: string;
  hint?: string;
  price?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition",
        checked ? "border-brand-600 bg-brand-50/60" : "border-paper-line hover:border-ink-faint",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input type="radio" className="form-radio mt-1 h-4 w-4 text-brand-600" checked={checked} onChange={onChange} disabled={disabled} />
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" />
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        {hint && <span className="block text-sm text-ink-muted">{hint}</span>}
      </span>
      {price && <span className="font-bold">{price}</span>}
    </label>
  );
}

export function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const search = useSearchParams();
  const user = useAuth((s) => s.user);
  const lines = useCart((s) => s.lines);
  const quote = useCart((s) => s.quote);
  const quoting = useCart((s) => s.quoting);
  const couponCode = useCart((s) => s.couponCode);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const setShipping = useCart((s) => s.setShipping);
  const refreshQuote = useCart((s) => s.refreshQuote);
  const clearCart = useCart((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [payment, setPayment] = useState<PaymentMethod>("stripe");
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { spedizione, pagamenti, contatti } = settings;
  const hasPersonalized = lines.some((l) => l.personalizzazione);
  const codAllowed = pagamenti.contrassegno.attivo && !hasPersonalized;

  // Ripristina i dati inseriti (es. al ritorno da un pagamento annullato)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      // ignora
    }
    void refreshQuote();
  }, [refreshQuote]);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignora
    }
  }, [form, mounted]);

  // Utente registrato: precompila email/nome e l'indirizzo dell'ultimo ordine
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: f.email || user.email,
      nome: f.nome || (user.name || "").split(" ")[0] || "",
      cognome: f.cognome || (user.name || "").split(" ").slice(1).join(" "),
    }));
    api<Order[]>("/orders/my-orders")
      .then((orders) => {
        const last = orders.find((o) => o.via);
        if (!last) return;
        setForm((f) =>
          f.via
            ? f
            : {
                ...f,
                telefono: f.telefono || last.telefono || "",
                via: last.via || "",
                numero: last.numero || "",
                cap: last.cap || "",
                citta: last.citta || "",
              }
        );
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (payment === "contrassegno" && !codAllowed) setPayment("stripe");
  }, [payment, codAllowed]);

  // Il costo di consegna dipende da metodo e CAP (consegna in giornata)
  useEffect(() => {
    if (!mounted || shippingMethod !== "giornata" || !/^\d{5}$/.test(form.cap)) return;
    void setShipping("giornata", form.cap);
  }, [form.cap, shippingMethod, mounted, setShipping]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const needsAddress = shippingMethod !== "ritiro";
  const fee = payment === "contrassegno" ? pagamenti.contrassegno.commissione : 0;
  const total = (quote?.total ?? 0) + fee;
  const byKey = useMemo(() => new Map((quote?.items || []).map((i) => [i.key, i])), [quote]);

  if (!mounted) {
    return (
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-extrabold">Il carrello è vuoto</h1>
        <p className="mt-2 text-ink-muted">Aggiungi dei prodotti per procedere con l&apos;ordine.</p>
        <Link href="/prodotti" className={buttonClass("primary", "md", "mt-6")}>Vai al catalogo</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const website = (new FormData(e.currentTarget).get("website") as string) || undefined;
    if (!privacy) {
      setError("Per completare l'ordine accetta i termini e l'informativa privacy.");
      return;
    }
    if (quote?.errors.length) {
      setError(quote.errors[0]);
      return;
    }
    setSubmitting(true);
    const body = {
      form: { ...form, stato: "Italia" },
      cart: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        selectedVariants: l.selectedVariants || null,
        personalizzazione: l.personalizzazione || null,
      })),
      couponCode,
      shippingMethod,
      paymentMethod: payment,
      privacy: true,
      website,
    };
    try {
      if (payment === "contrassegno") {
        const res = await api<{ orderId: number }>("/checkout/contrassegno", { method: "POST", body });
        clearCart();
        sessionStorage.removeItem(STORAGE_KEY);
        router.push(`/checkout/success?ordine=${res.orderId}&contrassegno=1`);
        return;
      }
      const res = await api<{ url: string }>("/checkout-session", { method: "POST", body });
      window.location.href = res.url;
    } catch (err) {
      const message = errorMessage(err, "Non è stato possibile avviare il pagamento. Riprova.");
      setError(message);
      toast.error(message);
      void refreshQuote();
      setSubmitting(false);
    }
  };

  return (
    <div className="container pb-16 pt-6">
      <Link href="/carrello" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Torna al carrello
      </Link>
      <h1 className="mb-6 text-3xl font-extrabold sm:text-4xl">Completa l&apos;ordine</h1>

      {search.get("annullato") && (
        <p className="mb-6 flex items-start gap-2 rounded-2xl bg-orange-soft p-4 text-sm font-medium text-orange-ink">
          <AlertTriangle className="h-5 w-5 shrink-0" /> Il pagamento è stato annullato e non ti è stato addebitato nulla.
          Puoi riprovare quando vuoi.
        </p>
      )}

      <form onSubmit={submit} className="relative grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
        <Honeypot />
        <div className="space-y-6">
          <Section n={1} title="I tuoi contatti">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                className="sm:col-span-2"
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                hint={user ? undefined : "Riceverai qui la conferma dell'ordine."}
              />
              <Input label="Nome" required autoComplete="given-name" value={form.nome} onChange={(e) => set("nome", e.target.value)} />
              <Input label="Cognome" required autoComplete="family-name" value={form.cognome} onChange={(e) => set("cognome", e.target.value)} />
              <Input
                className="sm:col-span-2"
                label="Telefono"
                type="tel"
                required
                autoComplete="tel"
                value={form.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                hint="Serve al corriere o per avvisarti quando l'ordine è pronto."
              />
            </div>
            {!user && (
              <p className="mt-4 text-sm text-ink-muted">
                Hai un account?{" "}
                <Link href="/login?redirect=/checkout" className="font-semibold text-brand-600 hover:underline">
                  Accedi
                </Link>{" "}
                per ritrovare l&apos;ordine nella tua area personale.
              </p>
            )}
          </Section>

          <Section n={2} title="Consegna">
            <div className="space-y-3">
              <Choice
                checked={shippingMethod === "spedizione"}
                onChange={() => void setShipping("spedizione")}
                icon={Truck}
                title="Spedizione a domicilio"
                hint={`${spedizione.tempiConsegna} · gratis da ${formatPrice(spedizione.sogliaGratuita)}`}
                price={
                  quote && quote.shippingMethod === "spedizione"
                    ? quote.shipping === 0
                      ? "Gratis"
                      : formatPrice(quote.shipping)
                    : undefined
                }
              />
              {spedizione.ritiroInNegozio && (
                <Choice
                  checked={shippingMethod === "ritiro"}
                  onChange={() => void setShipping("ritiro")}
                  icon={Store}
                  title="Ritiro in negozio"
                  hint={`${contatti.indirizzo}, Torre Annunziata · ti avvisiamo quando è pronto`}
                  price="Gratis"
                />
              )}
              {spedizione.giornata.attivo && (
                <Choice
                  checked={shippingMethod === "giornata"}
                  onChange={() => void setShipping("giornata", form.cap || null)}
                  icon={Zap}
                  title="Consegna in giornata"
                  hint={spedizione.giornata.descrizione}
                  price={formatPrice(spedizione.giornata.costo)}
                />
              )}
            </div>
            {quote?.shippingError && (
              <p className="mt-3 rounded-xl bg-magenta-soft p-3 text-sm font-medium text-magenta-ink">{quote.shippingError}</p>
            )}

            {needsAddress && (
              <div className="mt-5 grid gap-4 sm:grid-cols-6">
                <Input className="sm:col-span-4" label="Indirizzo" required autoComplete="address-line1" value={form.via} onChange={(e) => set("via", e.target.value)} placeholder="Via / Piazza" />
                <Input className="sm:col-span-2" label="Numero civico" required value={form.numero} onChange={(e) => set("numero", e.target.value)} />
                <Input
                  className="sm:col-span-2"
                  label="CAP"
                  required
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  value={form.cap}
                  onChange={(e) => set("cap", e.target.value.replace(/\D/g, ""))}
                />
                <Input className="sm:col-span-3" label="Città" required autoComplete="address-level2" value={form.citta} onChange={(e) => set("citta", e.target.value)} />
                <Input
                  className="sm:col-span-1"
                  label="Prov."
                  maxLength={2}
                  value={form.provincia}
                  onChange={(e) => set("provincia", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  placeholder="NA"
                />
              </div>
            )}
            <Textarea
              className="mt-4"
              label="Note per l'ordine (facoltative)"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Es. citofono, orari di consegna, richieste particolari…"
              rows={3}
            />
          </Section>

          <Section n={3} title="Fattura">
            <Checkbox
              label="Desidero ricevere la fattura (aziende, professionisti, scuole)"
              checked={form.richiestaFattura}
              onChange={(e) => set("richiestaFattura", e.target.checked)}
            />
            {form.richiestaFattura && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input className="sm:col-span-2" label="Ragione sociale / Nome e cognome" value={form.ragioneSociale} onChange={(e) => set("ragioneSociale", e.target.value)} />
                <Input label="Partita IVA" inputMode="numeric" maxLength={11} value={form.partitaIva} onChange={(e) => set("partitaIva", e.target.value.replace(/\D/g, ""))} />
                <Input label="Codice fiscale" maxLength={16} value={form.codiceFiscale} onChange={(e) => set("codiceFiscale", e.target.value.toUpperCase())} />
                <Input label="Codice SDI" maxLength={7} value={form.codiceSdi} onChange={(e) => set("codiceSdi", e.target.value.toUpperCase())} hint="Oppure indica la PEC" />
                <Input label="PEC" type="email" value={form.pec} onChange={(e) => set("pec", e.target.value)} />
              </div>
            )}
          </Section>

          <Section n={4} title="Pagamento">
            <div className="space-y-3">
              <Choice
                checked={payment === "stripe"}
                onChange={() => setPayment("stripe")}
                icon={CreditCard}
                title="Carta, Apple Pay o Google Pay"
                hint="Pagamento sicuro su Stripe: verrai reindirizzato per completare il pagamento."
              />
              {pagamenti.contrassegno.attivo && (
                <Choice
                  checked={payment === "contrassegno"}
                  onChange={() => setPayment("contrassegno")}
                  icon={Banknote}
                  title="Pagamento alla consegna (contrassegno)"
                  hint={
                    hasPersonalized
                      ? "Non disponibile per i prodotti personalizzati."
                      : `Paghi in contanti al corriere · commissione ${formatPrice(pagamenti.contrassegno.commissione)}`
                  }
                  disabled={!codAllowed}
                />
              )}
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="card space-y-5 p-5 sm:p-6">
            <h2 className="text-xl font-extrabold">Il tuo ordine</h2>
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {lines.map((l) => {
                const q = byKey.get(l.key);
                return (
                  <li key={l.key} className="flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-paper-line bg-white">
                      {l.immagine && <Image src={l.immagine} alt="" fill sizes="56px" className="object-contain p-1" />}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-bold text-white">
                        {l.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2 font-semibold leading-snug">{l.titolo}</p>
                      {(q?.variantLabel || l.variantLabel) && <p className="text-xs text-ink-muted">{q?.variantLabel || l.variantLabel}</p>}
                      {l.personalizzazione && <p className="text-xs text-ink-muted">“{l.personalizzazione}”</p>}
                      {q?.error && <p className="text-xs font-semibold text-magenta-ink">{q.error}</p>}
                    </div>
                    <span className="text-sm font-bold">{formatPrice((q?.prezzoUnitario ?? l.prezzo) * l.quantity)}</span>
                  </li>
                );
              })}
              {quote?.omaggio && (
                <li className="flex items-center justify-between gap-3 rounded-xl bg-orange-soft px-3 py-2 text-sm font-semibold text-orange-ink">
                  🎁 {quote.omaggio.titolo} <span>Omaggio</span>
                </li>
              )}
            </ul>
            <CouponField />
            {quote && (
              <OrderTotals
                quote={{ ...quote, paymentFee: fee, total }}
                loading={quoting}
              />
            )}

            <Checkbox
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              label={
                <>
                  Ho letto e accetto i{" "}
                  <Link href="/terms" target="_blank" className="font-semibold text-brand-600 underline">
                    Termini e condizioni
                  </Link>{" "}
                  e l&apos;
                  <Link href="/privacy" target="_blank" className="font-semibold text-brand-600 underline">
                    informativa privacy
                  </Link>
                  .
                </>
              }
            />

            {error && <p className="rounded-xl bg-magenta-soft p-3 text-sm font-medium text-magenta-ink" role="alert">{error}</p>}

            <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={quoting && !quote}>
              <Lock className="h-4 w-4" />
              {payment === "contrassegno" ? `Conferma ordine · ${formatPrice(total)}` : `Paga ora · ${formatPrice(total)}`}
            </Button>
            <p className="text-center text-xs text-ink-muted">
              Hai {settings.resi.giorni} giorni per il recesso. I prezzi includono l&apos;IVA.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
