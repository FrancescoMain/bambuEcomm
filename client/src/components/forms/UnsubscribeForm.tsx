"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailX } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Honeypot, Input } from "@/components/ui/Field";
import { FormAlert, FormSuccess, honeypot, isEmail, useFieldErrors } from "./shared";

/** Disiscrizione dalla newsletter (POST /newsletter/unsubscribe) */
export function UnsubscribeForm() {
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const { errors, clear, check } = useFieldErrors<"email">();

  // Il link nelle email può già contenere l'indirizzo (?email=...)
  useEffect(() => {
    const fromLink = params.get("email");
    if (fromLink) setEmail(fromLink);
  }, [params]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setServerError(null);
    if (!check({ email: !isEmail(email) ? "Inserisci un indirizzo email valido." : undefined }, formRef.current)) return;
    setLoading(true);
    try {
      await api("/newsletter/unsubscribe", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), website: honeypot(form) },
      });
      setDone(email.trim());
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <FormSuccess title="Iscrizione annullata" headingLevel={1} action={<LinkButton href="/">Torna allo shop</LinkButton>}>
        <p>
          Non invieremo più la newsletter a <strong className="text-ink">{done}</strong>. Ci mancherai!
        </p>
        <p className="mt-1">Se cambi idea, puoi iscriverti di nuovo in qualsiasi momento dal fondo di ogni pagina.</p>
      </FormSuccess>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-magenta-soft text-magenta">
        <MailX className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold">Disiscriviti dalla newsletter</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-muted">
        Inserisci l&apos;email con cui ti sei iscritto: smetterai di ricevere le nostre comunicazioni su novità e
        offerte. Le email sui tuoi ordini continueranno ad arrivare.
      </p>
      <form ref={formRef} onSubmit={submit} noValidate className="relative mx-auto mt-7 max-w-md space-y-4 text-left">
        <Input
          label="La tua email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear("email");
          }}
          error={errors.email}
        />
        {serverError && <FormAlert>{serverError}</FormAlert>}
        <Button type="submit" variant="dark" size="lg" loading={loading} className="w-full">
          Annulla l&apos;iscrizione
        </Button>
        <Honeypot />
      </form>
    </div>
  );
}
