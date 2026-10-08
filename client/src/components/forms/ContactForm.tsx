"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { errorMessage } from "@/lib/api/client";
import { whatsappUrl } from "@/lib/urls";
import { Button } from "@/components/ui/Button";
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

const ARGOMENTI = [
  "Informazioni su un prodotto",
  "Un mio ordine",
  "Resi e rimborsi",
  "Ordini per scuole e uffici",
  "Collaborazioni",
  "Altro",
];
const CON_ORDINE = ["Un mio ordine", "Resi e rimborsi"];

type Key = "nome" | "email" | "telefono" | "messaggio" | "consenso";

const EMPTY = { nome: "", email: "", telefono: "", argomento: ARGOMENTI[0], ordine: "", messaggio: "" };

export function ContactForm({ whatsapp }: { whatsapp?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [consenso, setConsenso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ nome: string; email: string } | null>(null);
  const { errors, clear, check } = useFieldErrors<Key>();

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (key !== "argomento" && key !== "ordine") clear(key);
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
        messaggio:
          values.messaggio.trim().length < MIN_MESSAGE
            ? `Scrivi almeno ${MIN_MESSAGE} caratteri, così possiamo aiutarti meglio.`
            : undefined,
        consenso: !consenso ? "Per inviare il messaggio accetta l'informativa privacy." : undefined,
      },
      formRef.current
    );
    if (!ok) return;

    const ordine = CON_ORDINE.includes(values.argomento) ? values.ordine.replace(/[^\d]/g, "") : "";
    setLoading(true);
    try {
      await sendContactForm({
        tipo: "contatto",
        nome: values.nome.trim(),
        email: values.email.trim(),
        telefono: values.telefono.trim() || undefined,
        oggetto: ordine ? `${values.argomento} (ordine #${ordine})` : values.argomento,
        messaggio: values.messaggio.trim(),
        consenso: true,
        website: honeypot(form),
      });
      setSent({ nome: values.nome.trim().split(/\s+/)[0], email: values.email.trim() });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <FormSuccess
        title="Messaggio inviato!"
        action={
          <Button
            variant="outline"
            onClick={() => {
              setSent(null);
              setValues(EMPTY);
              setConsenso(false);
            }}
          >
            Scrivi un altro messaggio
          </Button>
        }
      >
        <p>
          Grazie{sent.nome ? `, ${sent.nome}` : ""}! Ti risponderemo il prima possibile all&apos;indirizzo{" "}
          <strong className="text-ink">{sent.email}</strong>.
        </p>
      </FormSuccess>
    );
  }

  const withOrder = CON_ORDINE.includes(values.argomento);

  return (
    <div>
      <h2 className="text-2xl font-extrabold">Scrivici un messaggio</h2>
      <p className="mt-1.5 text-[15px] text-ink-muted">
        Domande su un prodotto, un ordine o una disponibilità: ti rispondiamo il prima possibile.
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
            hint="Facoltativo, se preferisci essere richiamato"
            value={values.telefono}
            onChange={set("telefono")}
            error={errors.telefono}
          />
          <Select label="Argomento" name="argomento" value={values.argomento} onChange={set("argomento")}>
            {ARGOMENTI.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>

        {withOrder && (
          <Input
            label="Numero d'ordine"
            name="ordine"
            inputMode="numeric"
            placeholder="Es. 1024"
            hint="Facoltativo: lo trovi nell'email di conferma"
            value={values.ordine}
            onChange={set("ordine")}
            className="sm:max-w-[50%] sm:pr-2"
          />
        )}

        <Textarea
          label="Messaggio"
          name="messaggio"
          required
          rows={6}
          maxLength={5000}
          placeholder="Come possiamo aiutarti?"
          value={values.messaggio}
          onChange={set("messaggio")}
          error={errors.messaggio}
          aria-invalid={errors.messaggio ? true : undefined}
          hint={`Almeno ${MIN_MESSAGE} caratteri`}
        />

        <PrivacyConsent
          id="contatto-consenso"
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
            Invia messaggio
          </Button>
        </div>

        {whatsapp && (
          <p className="border-t border-paper-line pt-4 text-sm text-ink-muted">
            Hai fretta?{" "}
            <a
              href={whatsappUrl(whatsapp, "Ciao! Vorrei qualche informazione")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
            >
              Scrivici su WhatsApp
            </a>
            : è il modo più rapido per raggiungerci negli orari di apertura.
          </p>
        )}
        <Honeypot />
      </form>
    </div>
  );
}
