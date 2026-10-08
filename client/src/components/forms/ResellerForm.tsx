"use client";

import { useRef, useState } from "react";
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

const ATTIVITA = [
  "Cartoleria o cartolibreria",
  "Libreria o edicola",
  "Negozio di giocattoli",
  "Tabaccheria o bazar",
  "Negozio di articoli da regalo",
  "Altro",
];

type Key = "nome" | "ragioneSociale" | "partitaIva" | "email" | "telefono" | "messaggio" | "consenso";

const EMPTY = {
  nome: "",
  ragioneSociale: "",
  partitaIva: "",
  email: "",
  telefono: "",
  citta: "",
  attivita: ATTIVITA[0],
  messaggio: "",
};

/** "IT 01234567890" -> "01234567890" */
const cleanVat = (value: string) => value.replace(/\s+/g, "").replace(/^IT/i, "");

/** Richiesta per diventare rivenditore (POST /contact tipo "b2b") */
export function ResellerForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [consenso, setConsenso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const { errors, clear, check } = useFieldErrors<Key>();

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (key !== "citta" && key !== "attivita") clear(key);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setServerError(null);
    const ok = check(
      {
        nome: values.nome.trim().length < 2 ? "Inserisci nome e cognome del referente." : undefined,
        ragioneSociale: values.ragioneSociale.trim().length < 2 ? "Inserisci la ragione sociale." : undefined,
        partitaIva: !/^\d{11}$/.test(cleanVat(values.partitaIva))
          ? "La partita IVA deve contenere 11 cifre."
          : undefined,
        email: !isEmail(values.email) ? "Inserisci un indirizzo email valido." : undefined,
        telefono: values.telefono.trim() && !isPhone(values.telefono) ? "Controlla il numero di telefono." : undefined,
        messaggio:
          values.messaggio.trim().length < MIN_MESSAGE
            ? `Raccontaci qualcosa della tua attività (almeno ${MIN_MESSAGE} caratteri).`
            : undefined,
        consenso: !consenso ? "Per inviare la richiesta accetta l'informativa privacy." : undefined,
      },
      formRef.current
    );
    if (!ok) return;

    setLoading(true);
    try {
      await sendContactForm({
        tipo: "b2b",
        nome: values.nome.trim(),
        email: values.email.trim(),
        telefono: values.telefono.trim() || undefined,
        oggetto: `Richiesta rivenditore · ${values.attivita}`,
        messaggio: values.messaggio.trim(),
        consenso: true,
        ragioneSociale: values.ragioneSociale.trim(),
        partitaIva: cleanVat(values.partitaIva),
        citta: values.citta.trim() || undefined,
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
        title="Richiesta inviata!"
        action={
          <LinkButton href="/prodotti" variant="outline">
            Intanto sfoglia il catalogo
          </LinkButton>
        }
      >
        <p>
          Grazie! Valutiamo la tua richiesta e ti scriviamo a <strong className="text-ink">{sent}</strong> con le
          condizioni dedicate alla tua attività.
        </p>
      </FormSuccess>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold">Richiedi le condizioni per rivenditori</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        Compila il modulo: ti ricontattiamo per conoscere la tua attività e inviarti listino e condizioni.
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
            label="Ragione sociale"
            name="ragioneSociale"
            autoComplete="organization"
            required
            value={values.ragioneSociale}
            onChange={set("ragioneSociale")}
            error={errors.ragioneSociale}
          />
          <Input
            label="Partita IVA"
            name="partitaIva"
            inputMode="numeric"
            autoComplete="off"
            maxLength={16}
            placeholder="11 cifre"
            required
            value={values.partitaIva}
            onChange={set("partitaIva")}
            error={errors.partitaIva}
          />
          <Select label="Tipo di attività" name="attivita" value={values.attivita} onChange={set("attivita")}>
            {ATTIVITA.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
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
          <Input
            label="Città"
            name="citta"
            autoComplete="address-level2"
            value={values.citta}
            onChange={set("citta")}
            className="sm:col-span-2"
          />
        </div>

        <Textarea
          label="Raccontaci la tua attività"
          name="messaggio"
          required
          rows={5}
          maxLength={5000}
          placeholder="Che tipo di negozio hai, quali prodotti ti interessano, volumi indicativi..."
          value={values.messaggio}
          onChange={set("messaggio")}
          error={errors.messaggio}
          aria-invalid={errors.messaggio ? true : undefined}
          hint={`Almeno ${MIN_MESSAGE} caratteri`}
        />

        <PrivacyConsent
          id="b2b-consenso"
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
