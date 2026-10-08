"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { errorMessage } from "@/lib/api/client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Honeypot, Input, Select, Textarea } from "@/components/ui/Field";
import {
  FormAlert,
  FormSuccess,
  MIN_MESSAGE,
  PrivacyConsent,
  RequiredNote,
  honeypot,
  isEmail,
  isPhone,
  sendContactForm,
  useFieldErrors,
} from "./shared";

const TIPOLOGIE = ["Scuola o classe", "Ufficio o azienda", "Associazione", "Ente pubblico", "Evento o festa", "Altro"];
const BUDGET = ["Da definire", "Fino a 250 €", "250 – 500 €", "500 – 1.000 €", "1.000 – 2.500 €", "Oltre 2.500 €"];

type Key = "nome" | "email" | "telefono" | "dataConsegna" | "messaggio" | "consenso";

const EMPTY = {
  nome: "",
  ente: "",
  email: "",
  telefono: "",
  tipologia: TIPOLOGIE[0],
  quantita: "",
  dataConsegna: "",
  budget: BUDGET[0],
  messaggio: "",
};

const localIsoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "2026-10-20" -> "20/10/2026" */
const toItalianDate = (iso: string) => iso.split("-").reverse().join("/");

/** Richiesta di preventivo per scuole, uffici e associazioni (POST /contact tipo "preventivo") */
export function QuoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [consenso, setConsenso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [today, setToday] = useState<string>();
  const { errors, clear, check } = useFieldErrors<Key>();

  // Calcolata nel browser (fuso orario dell'utente), evita differenze con l'HTML del server
  useEffect(() => setToday(localIsoDate()), []);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (key === "nome" || key === "email" || key === "telefono" || key === "dataConsegna" || key === "messaggio") clear(key);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setServerError(null);
    const ok = check(
      {
        nome: values.nome.trim().length < 2 ? "Inserisci il tuo nome." : undefined,
        email: !isEmail(values.email) ? "Inserisci un indirizzo email valido." : undefined,
        telefono: values.telefono.trim() && !isPhone(values.telefono) ? "Controlla il numero di telefono." : undefined,
        dataConsegna:
          values.dataConsegna && today && values.dataConsegna < today ? "Scegli una data da oggi in poi." : undefined,
        messaggio:
          values.messaggio.trim().length < MIN_MESSAGE
            ? `Descrivi cosa ti serve (almeno ${MIN_MESSAGE} caratteri).`
            : undefined,
        consenso: !consenso ? "Per inviare la richiesta accetta l'informativa privacy." : undefined,
      },
      formRef.current
    );
    if (!ok) return;

    setLoading(true);
    try {
      await sendContactForm({
        tipo: "preventivo",
        nome: values.nome.trim(),
        email: values.email.trim(),
        telefono: values.telefono.trim() || undefined,
        oggetto: `Preventivo · ${values.tipologia}`,
        messaggio: values.messaggio.trim(),
        consenso: true,
        ente: values.ente.trim() || undefined,
        tipologia: values.tipologia,
        quantita: values.quantita.trim() || undefined,
        dataConsegna: values.dataConsegna ? toItalianDate(values.dataConsegna) : undefined,
        budget: values.budget,
        website: honeypot(form),
      });
      setSent(values.email.trim());
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <FormSuccess
        title="Richiesta di preventivo inviata!"
        action={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setSent(null);
                setValues(EMPTY);
                setConsenso(false);
              }}
            >
              Nuova richiesta
            </Button>
            <LinkButton href="/prodotti">Sfoglia il catalogo</LinkButton>
          </>
        }
      >
        <p>
          Grazie! Prepariamo la proposta su misura e ti scriviamo a <strong className="text-ink">{sent}</strong> con
          prezzi, disponibilità e tempi di consegna.
        </p>
      </FormSuccess>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold">Richiedi un preventivo</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        Più dettagli ci dai, più la proposta sarà precisa. Il preventivo è gratuito e senza impegno.
      </p>

      <form ref={formRef} onSubmit={submit} noValidate className="relative mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome e cognome"
            name="nome"
            autoComplete="name"
            required
            value={values.nome}
            onChange={set("nome")}
            error={errors.nome}
          />
          <Input
            label="Scuola, ente o azienda"
            name="ente"
            autoComplete="organization"
            placeholder="Es. I.C. Parini, classe 3ªB"
            value={values.ente}
            onChange={set("ente")}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={set("email")}
            error={errors.email}
          />
          <Input
            label="Telefono"
            name="telefono"
            type="tel"
            autoComplete="tel"
            value={values.telefono}
            onChange={set("telefono")}
            error={errors.telefono}
          />
          <Select label="Per chi è l'ordine" name="tipologia" value={values.tipologia} onChange={set("tipologia")}>
            {TIPOLOGIE.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Input
            label="Quantità indicativa"
            name="quantita"
            maxLength={80}
            placeholder="Es. 25 kit, uno per alunno"
            value={values.quantita}
            onChange={set("quantita")}
          />
          <Input
            label="Consegna desiderata entro il"
            name="dataConsegna"
            type="date"
            min={today}
            value={values.dataConsegna}
            onChange={set("dataConsegna")}
            error={errors.dataConsegna}
          />
          <Select label="Budget indicativo" name="budget" value={values.budget} onChange={set("budget")}>
            {BUDGET.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Cosa ti serve?"
          name="messaggio"
          required
          rows={6}
          maxLength={5000}
          placeholder="Elenca prodotti, marche preferite e quantità. Puoi anche incollare qui la lista della scuola."
          value={values.messaggio}
          onChange={set("messaggio")}
          error={errors.messaggio}
          aria-invalid={errors.messaggio ? true : undefined}
          hint={`Almeno ${MIN_MESSAGE} caratteri`}
        />

        <PrivacyConsent
          id="preventivo-consenso"
          checked={consenso}
          onChange={(v) => {
            setConsenso(v);
            clear("consenso");
          }}
          error={errors.consenso}
        />

        {serverError && <FormAlert>{serverError}</FormAlert>}

        <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <RequiredNote />
          <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
            {!loading && <Send className="h-4 w-4" aria-hidden />}
            Invia la richiesta
          </Button>
        </div>
        <Honeypot />
      </form>
    </div>
  );
}
