"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CircleCheckBig, Info, Mail, PackageOpen, Printer, Search, Truck, Wallet } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Honeypot, Input, Select, Textarea } from "@/components/ui/Field";
import { FormAlert, honeypot, isEmail, useFieldErrors } from "./shared";

type Articolo = { orderItemId: number; titolo: string; quantity: number; personalizzato: boolean };
type Lookup = { orderId: number; data: string; nome: string; articoli: Articolo[] };
type Selection = Record<number, { selected: boolean; quantity: number }>;

export const MOTIVI = [
  "Ho cambiato idea",
  "Il prodotto non corrisponde alla descrizione",
  "Colore o variante diversi da quelli attesi",
  "Il prodotto è arrivato danneggiato",
  "Il prodotto è difettoso o non funziona",
  "Ho ricevuto un articolo sbagliato",
  "Ho ordinato per errore o in doppio",
  "La consegna è arrivata troppo tardi",
  "Altro",
];
/** Motivi che rientrano nella garanzia legale: lo segnaliamo al cliente */
const GARANZIA = [MOTIVI[3], MOTIVI[4], MOTIVI[5]];

const STEPS = ["Ordine", "Articoli", "Conferma"];

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Passaggi del recesso">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition",
                done && "bg-brand-600 text-white",
                current && "bg-ink text-white",
                !done && !current && "bg-paper-warm text-ink-muted"
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : n}
            </span>
            <span className={cn("text-sm font-bold", current ? "text-ink" : "sr-only text-ink-muted sm:not-sr-only")}>
              <span className="sr-only">Passo {n}: </span>
              {label}
              {done && <span className="sr-only"> (completato)</span>}
            </span>
            {n < STEPS.length && <span className={cn("h-0.5 flex-1 rounded-full", done ? "bg-brand-500" : "bg-paper-line")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Recesso online in 3 passaggi ("funzione di recesso" dell'art. 11-bis della
 * Dir. 2011/83/UE, introdotto dalla Dir. UE 2023/2673): ordine + email -> articoli -> conferma.
 */
export function RecessoWizard({ giorni, indirizzoReso }: { giorni: number; indirizzoReso: string }) {
  const params = useSearchParams();
  const user = useAuth((s) => s.user);
  const [step, setStep] = useState(1);
  const [ordine, setOrdine] = useState("");
  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; requestId: number } | null>(null);
  const step1 = useFieldErrors<"ordine" | "email">();
  const step2 = useFieldErrors<"articoli" | "nome">();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Precompila dal link "Richiedi il recesso" (?ordine=) e dall'account
  useEffect(() => {
    const fromLink = params.get("ordine");
    if (fromLink) setOrdine((v) => v || fromLink.replace(/[^\d]/g, ""));
  }, [params]);
  useEffect(() => {
    if (user?.email) setEmail((v) => v || user.email);
  }, [user]);

  // A ogni passaggio il focus va al titolo, così il lettore di schermo lo annuncia
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  const findOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setServerError(null);
    const orderId = ordine.replace(/[^\d]/g, "");
    const ok = step1.check(
      {
        ordine: !orderId ? "Inserisci il numero d'ordine (lo trovi nell'email di conferma)." : undefined,
        email: !isEmail(email) ? "Inserisci l'email usata per l'ordine." : undefined,
      },
      form
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await api<Lookup>("/recesso/ordine", {
        method: "POST",
        auth: false,
        body: { orderId: Number(orderId), email: email.trim(), website: honeypot(form) },
      });
      setLookup(res);
      setSelection(
        Object.fromEntries(
          res.articoli.map((a) => [a.orderItemId, { selected: !a.personalizzato, quantity: a.quantity }])
        )
      );
      setNome((v) => v || res.nome);
      step2.setErrors({});
      setStep(2);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const chosen = lookup ? lookup.articoli.filter((a) => !a.personalizzato && selection[a.orderItemId]?.selected) : [];
  const returnable = lookup ? lookup.articoli.filter((a) => !a.personalizzato) : [];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!lookup) return;
    setServerError(null);
    const ok = step2.check(
      {
        articoli: chosen.length === 0 ? "Seleziona almeno un articolo da restituire." : undefined,
        nome: nome.trim().length < 2 ? "Inserisci nome e cognome." : undefined,
      },
      form
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await api<{ message: string; requestId: number }>("/recesso", {
        method: "POST",
        auth: false,
        body: {
          orderId: lookup.orderId,
          email: email.trim(),
          nome: nome.trim(),
          articoli: chosen.map((a) => ({ orderItemId: a.orderItemId, quantity: selection[a.orderItemId].quantity })),
          motivo: motivo || undefined,
          note: note.trim() || undefined,
          website: honeypot(form),
        },
      });
      setResult(res);
      setStep(3);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: number, selected: boolean) => {
    setSelection((s) => ({ ...s, [id]: { ...s[id], selected } }));
    step2.clear("articoli");
  };

  const title = "text-2xl font-extrabold outline-none";

  return (
    <div className="space-y-8">
      <Stepper step={step} />

      {step === 1 && (
        <form onSubmit={findOrder} noValidate className="relative space-y-5">
          <div>
            <h2 ref={titleRef} tabIndex={-1} className={title}>
              Trova il tuo ordine
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-muted">
              Inserisci il numero d&apos;ordine e l&apos;email che hai usato per l&apos;acquisto: puoi recedere entro{" "}
              {giorni} giorni dalla consegna.
            </p>
          </div>
          <Honeypot />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Numero d'ordine"
              name="ordine"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Es. 1024"
              required
              value={ordine}
              onChange={(e) => {
                setOrdine(e.target.value);
                step1.clear("ordine");
              }}
              error={step1.errors.ordine}
              hint="Lo trovi nell'email di conferma dell'ordine"
            />
            <Input
              label="Email dell'ordine"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                step1.clear("email");
              }}
              error={step1.errors.email}
            />
          </div>
          {serverError && (
            <FormAlert>
              {serverError}{" "}
              <Link href="/contatti" className="font-bold underline">
                Contattaci
              </Link>{" "}
              se pensi che ci sia un errore.
            </FormAlert>
          )}
          <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
            {!loading && <Search className="h-4 w-4" aria-hidden />}
            Cerca l&apos;ordine
          </Button>
        </form>
      )}

      {step === 2 && lookup && (
        <form onSubmit={submit} noValidate className="relative space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 ref={titleRef} tabIndex={-1} className={title}>
                Scegli cosa restituire
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-muted">
                Ordine <strong className="text-ink">#{lookup.orderId}</strong> del {formatDate(lookup.data)}
                {lookup.nome ? ` · ${lookup.nome}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setServerError(null);
                setStep(1);
              }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Cambia ordine
            </Button>
          </div>
          <Honeypot />

          <fieldset>
            <legend className="field-label">Articoli dell&apos;ordine</legend>
            <ul
              className={cn(
                "divide-y divide-paper-line overflow-hidden rounded-2xl border",
                step2.errors.articoli ? "border-magenta" : "border-paper-line"
              )}
            >
              {lookup.articoli.map((a) => {
                const sel = selection[a.orderItemId];
                const inputId = `art-${a.orderItemId}`;
                return (
                  <li key={a.orderItemId} className={cn("p-4", a.personalizzato ? "bg-paper" : sel?.selected && "bg-brand-50/60")}>
                    <div className="flex items-start gap-3">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={!a.personalizzato && !!sel?.selected}
                        disabled={a.personalizzato}
                        onChange={(e) => toggle(a.orderItemId, e.target.checked)}
                        aria-invalid={step2.errors.articoli ? true : undefined}
                        aria-describedby={a.personalizzato ? `${inputId}-pers` : undefined}
                        className="form-checkbox mt-0.5 h-5 w-5 shrink-0 rounded-md border-paper-line text-brand-600 focus:ring-brand-500/30 disabled:opacity-40"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={inputId} className={cn("font-semibold leading-snug", a.personalizzato ? "text-ink-muted" : "cursor-pointer")}>
                          {a.titolo}
                        </label>
                        <p className="mt-0.5 text-sm text-ink-muted">Quantità acquistata: {a.quantity}</p>
                        {!a.personalizzato && sel?.selected && a.quantity > 1 && (
                          <div className="mt-2 flex items-center gap-2">
                            <label htmlFor={`${inputId}-q`} className="text-sm font-semibold text-ink-soft">
                              Quantità da restituire
                            </label>
                            <select
                              id={`${inputId}-q`}
                              value={sel.quantity}
                              onChange={(e) =>
                                setSelection((s) => ({
                                  ...s,
                                  [a.orderItemId]: { ...s[a.orderItemId], quantity: Number(e.target.value) },
                                }))
                              }
                              className="field w-auto py-1.5 pl-3 pr-9 text-sm"
                            >
                              {Array.from({ length: a.quantity }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {a.personalizzato && (
                          <p id={`${inputId}-pers`} className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                            <Badge tone="orange">Personalizzato</Badge>
                            Escluso dal recesso (art. 59 Codice del Consumo)
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {step2.errors.articoli && <p className="mt-1.5 text-xs text-magenta-ink">{step2.errors.articoli}</p>}
            {returnable.length === 0 && (
              <FormAlert tone="info" className="mt-3">
                Tutti gli articoli di questo ordine sono personalizzati e non possono essere restituiti con il recesso. Se
                c&apos;è un problema con l&apos;ordine,{" "}
                <Link href="/contatti" className="font-bold underline">
                  contattaci
                </Link>
                .
              </FormAlert>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nome e cognome"
              name="nome"
              autoComplete="name"
              required
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                step2.clear("nome");
              }}
              error={step2.errors.nome}
            />
            <Select
              label="Motivo (facoltativo)"
              name="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              hint="Non sei obbligato a indicarlo: ci aiuta a migliorare."
            >
              <option value="">Preferisco non indicarlo</option>
              {MOTIVI.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>

          {GARANZIA.includes(motivo) && (
            <FormAlert tone="info">
              Per un prodotto difettoso, danneggiato o sbagliato hai diritto alla garanzia legale: la soluzione (sostituzione o
              rimborso) è senza costi per te. Puoi procedere qui oppure{" "}
              <Link href="/contatti" className="font-bold underline">
                scriverci
              </Link>{" "}
              con qualche foto.
            </FormAlert>
          )}

          <Textarea
            label="Note (facoltativo)"
            name="note"
            rows={3}
            maxLength={2000}
            placeholder="Vuoi aggiungere qualcosa? Ad esempio come preferisci restituire i prodotti."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="rounded-2xl border border-paper-line bg-paper p-4 text-sm leading-relaxed text-ink-soft">
            <p className="font-bold text-ink">Dichiarazione di recesso</p>
            <p className="mt-1">
              Con la presente io, <strong className="text-ink">{nome.trim() || "…"}</strong>, notifico il recesso dal
              contratto di vendita dei beni selezionati qui sopra, relativi all&apos;ordine n. {lookup.orderId} del{" "}
              {formatDate(lookup.data)}.
            </p>
          </div>

          {serverError && <FormAlert>{serverError}</FormAlert>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Indietro
            </Button>
            <Button type="submit" size="lg" loading={loading} disabled={returnable.length === 0}>
              {!loading && <Check className="h-5 w-5" aria-hidden />}
              Conferma recesso
            </Button>
          </div>
        </form>
      )}

      {step === 3 && result && lookup && (
        <div className="space-y-8">
          <div className="flex flex-col items-center rounded-3xl bg-brand-50 px-6 py-10 text-center" role="status">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
              <CircleCheckBig className="h-8 w-8" aria-hidden />
            </span>
            <h2 ref={titleRef} tabIndex={-1} className={cn(title, "mt-5")}>
              Richiesta di recesso inviata
            </h2>
            <p className="mt-2 max-w-md text-[15px] text-ink-soft">{result.message}</p>
            <p className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm shadow-sm">
              Numero richiesta <strong className="text-lg font-extrabold text-ink">#{result.requestId}</strong> · ordine #
              {lookup.orderId}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-extrabold">Articoli che restituisci</h3>
            <ul className="mt-3 divide-y divide-paper-line rounded-2xl border border-paper-line bg-white">
              {chosen.map((a) => (
                <li key={a.orderItemId} className="flex items-center justify-between gap-4 p-4 text-[15px]">
                  <span className="font-semibold">{a.titolo}</span>
                  <span className="shrink-0 text-ink-muted">× {selection[a.orderItemId].quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-extrabold">Cosa succede adesso</h3>
            <ol className="mt-4 space-y-5">
              {[
                {
                  icon: Mail,
                  title: "Controlla la tua email",
                  text: (
                    <>
                      Ti abbiamo inviato a <strong className="text-ink">{email.trim()}</strong> la conferma della richiesta: conservala.
                    </>
                  ),
                },
                {
                  icon: PackageOpen,
                  title: "Prepara il pacco",
                  text: "Imballa i prodotti integri, completi di accessori e nella confezione originale, se possibile.",
                },
                {
                  icon: Truck,
                  title: "Spediscilo entro 14 giorni",
                  text: (
                    <>
                      Invialo a <strong className="text-ink">{indirizzoReso}</strong>. Le spese di restituzione sono a tuo
                      carico: conserva la ricevuta della spedizione.
                    </>
                  ),
                },
                {
                  icon: Wallet,
                  title: "Ricevi il rimborso",
                  text: "Entro 14 giorni dalla tua richiesta, con lo stesso metodo di pagamento. Possiamo attendere di ricevere i prodotti, o la prova della spedizione, prima di rimborsarti.",
                },
              ].map(({ icon: Icon, title: t, text }) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-paper-warm text-brand-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-[15px] leading-relaxed text-ink-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-3 border-t border-paper-line pt-6 sm:flex-row print:hidden">
            <LinkButton href="/">Torna allo shop</LinkButton>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Stampa la ricevuta
            </Button>
          </div>
          <p className="flex items-start gap-2 text-sm text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Hai domande sul reso? Scrivici citando il numero richiesta #{result.requestId}.
          </p>
        </div>
      )}
    </div>
  );
}
