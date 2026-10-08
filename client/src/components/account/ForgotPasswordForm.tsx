"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Honeypot, Input } from "@/components/ui/Field";
import { FormAlert, FormSuccess, honeypot, isEmail, useFieldErrors } from "@/components/forms/shared";

export function ForgotPasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { errors, clear, check } = useFieldErrors<"email">();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setServerError(null);
    if (!check({ email: !isEmail(email) ? "Inserisci un indirizzo email valido." : undefined }, formRef.current)) return;
    setLoading(true);
    try {
      await api("/auth/request-password-reset", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), website: honeypot(form) },
      });
      setSentTo(email.trim());
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <FormSuccess
        title="Controlla la tua email"
        className="bg-paper"
        action={
          <>
            <LinkButton href="/login">Torna all&apos;accesso</LinkButton>
            <Button variant="outline" onClick={() => setSentTo(null)}>
              Usa un&apos;altra email
            </Button>
          </>
        }
      >
        <p>
          Se <strong className="text-ink">{sentTo}</strong> è registrata, a breve riceverai un link per scegliere una nuova
          password. Il link è valido per 1 ora.
        </p>
        <p className="mt-2 text-sm text-ink-muted">Non la trovi? Dai un&apos;occhiata nella cartella spam o promozioni.</p>
      </FormSuccess>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative space-y-5">
      <Input
        label="Email del tuo account"
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
      <Button type="submit" size="lg" loading={loading} className="w-full">
        {!loading && <Send className="h-4 w-4" aria-hidden />}
        Inviami il link
      </Button>
      <p className="border-t border-paper-line pt-5 text-center text-[15px]">
        <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Torna all&apos;accesso
        </Link>
      </p>
      <Honeypot />
    </form>
  );
}
