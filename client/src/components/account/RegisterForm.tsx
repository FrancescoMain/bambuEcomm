"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Checkbox, Honeypot, Input } from "@/components/ui/Field";
import { FormAlert, PrivacyConsent, honeypot, isEmail, useFieldErrors } from "@/components/forms/shared";
import { MIN_PASSWORD, PasswordInput } from "@/components/forms/PasswordInput";
import { afterLoginPath, withRedirect } from "./redirect";

type Key = "name" | "email" | "password" | "consenso";

export function RegisterForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const register = useAuth((s) => s.register);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [consenso, setConsenso] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const { errors, clear, check } = useFieldErrors<Key>();

  // Dopo la registrazione l'utente è già autenticato: alla pagina richiesta
  useEffect(() => {
    if (ready && user) router.replace(afterLoginPath(user, redirect));
  }, [ready, user, redirect, router]);

  const set = (key: "name" | "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // campo trappola compilato: è un bot, non creiamo nulla
    if (honeypot(e.currentTarget)) return;
    setServerError(null);
    setExists(false);
    const ok = check(
      {
        name: values.name.trim().length < 2 ? "Inserisci il tuo nome." : undefined,
        email: !isEmail(values.email) ? "Inserisci un indirizzo email valido." : undefined,
        password:
          values.password.length < MIN_PASSWORD
            ? `La password deve avere almeno ${MIN_PASSWORD} caratteri.`
            : undefined,
        consenso: !consenso ? "Per creare l'account accetta l'informativa privacy." : undefined,
      },
      formRef.current
    );
    if (!ok) return;
    setLoading(true);
    try {
      const email = values.email.trim().toLowerCase();
      await register({ name: values.name.trim(), email, password: values.password });
      if (newsletter) {
        // facoltativa: un errore qui non blocca la registrazione
        api("/newsletter/subscribe", {
          method: "POST",
          auth: false,
          body: { email, nome: values.name.trim(), consenso: true },
        }).catch(() => undefined);
      }
      toast.success("Benvenuto in Bambù! Il tuo account è pronto.");
    } catch (err) {
      const message = errorMessage(err);
      const duplicate = /esistente|già registrat/i.test(message);
      setExists(duplicate);
      setServerError(duplicate ? "Esiste già un account con questa email." : message);
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative space-y-5">
      <Input
        label="Nome e cognome"
        name="name"
        autoComplete="name"
        required
        value={values.name}
        onChange={set("name")}
        error={errors.name}
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
      <PasswordInput
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        meter
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        hint={`Almeno ${MIN_PASSWORD} caratteri: meglio se con maiuscole, numeri e simboli.`}
      />

      <div className="space-y-3 rounded-2xl bg-paper p-4">
        <PrivacyConsent
          id="register-consenso"
          checked={consenso}
          onChange={(v) => {
            setConsenso(v);
            clear("consenso");
          }}
          error={errors.consenso}
        >
          Ho letto l&apos;
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
          >
            informativa privacy
          </Link>{" "}
          e accetto i{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
          >
            termini e condizioni
          </Link>
          .<span className="text-magenta">&nbsp;*</span>
        </PrivacyConsent>
        <Checkbox
          name="newsletter"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
          label="Voglio ricevere la newsletter con novità e offerte (facoltativo, puoi disiscriverti quando vuoi)."
        />
      </div>

      {serverError && (
        <FormAlert>
          {serverError}
          {exists && (
            <>
              {" "}
              <Link href={withRedirect("/login", redirect)} className="font-bold underline">
                Accedi
              </Link>{" "}
              oppure{" "}
              <Link href="/forgot-password" className="font-bold underline">
                reimposta la password
              </Link>
              .
            </>
          )}
        </FormAlert>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {!loading && <UserPlus className="h-4 w-4" aria-hidden />}
        Crea il mio account
      </Button>

      <p className="border-t border-paper-line pt-5 text-center text-[15px] text-ink-muted">
        Hai già un account?{" "}
        <Link href={withRedirect("/login", redirect)} className="font-bold text-brand-700 hover:underline">
          Accedi
        </Link>
      </p>
      <Honeypot />
    </form>
  );
}
