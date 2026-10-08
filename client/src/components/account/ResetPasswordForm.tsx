"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { Button, LinkButton } from "@/components/ui/Button";
import { FormAlert, FormSuccess, useFieldErrors } from "@/components/forms/shared";
import { MIN_PASSWORD, PasswordInput } from "@/components/forms/PasswordInput";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { errors, clear, check } = useFieldErrors<"password" | "confirm">();

  if (!token) {
    return (
      <div className="space-y-5">
        <FormAlert>
          Il link per reimpostare la password non è valido o è incompleto. Assicurati di aver aperto il link completo
          ricevuto via email, oppure richiedine uno nuovo.
        </FormAlert>
        <LinkButton href="/forgot-password" size="lg" className="w-full">
          Richiedi un nuovo link
        </LinkButton>
      </div>
    );
  }

  if (done) {
    return (
      <FormSuccess
        title="Password aggiornata!"
        className="bg-paper"
        action={<LinkButton href="/login">Accedi ora</LinkButton>}
      >
        <p>Da adesso puoi accedere al tuo account con la nuova password.</p>
      </FormSuccess>
    );
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const ok = check(
      {
        password:
          password.length < MIN_PASSWORD ? `La password deve avere almeno ${MIN_PASSWORD} caratteri.` : undefined,
        confirm: confirm !== password ? "Le due password non coincidono." : undefined,
      },
      formRef.current
    );
    if (!ok) return;
    setLoading(true);
    try {
      await api("/auth/reset-password", { method: "POST", auth: false, body: { token, newPassword: password } });
      setDone(true);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const expired = serverError && /token|scadut|utilizzat/i.test(serverError);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      <PasswordInput
        label="Nuova password"
        name="password"
        autoComplete="new-password"
        required
        meter
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          clear("password");
        }}
        error={errors.password}
        hint={`Almeno ${MIN_PASSWORD} caratteri: meglio se con maiuscole, numeri e simboli.`}
      />
      <PasswordInput
        label="Ripeti la nuova password"
        name="confirm"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          clear("confirm");
        }}
        error={errors.confirm}
      />
      {serverError && (
        <FormAlert>
          {expired ? "Il link non è più valido (è scaduto o è già stato usato)." : serverError}
          {expired && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-bold underline">
                Richiedine uno nuovo
              </Link>
              .
            </>
          )}
        </FormAlert>
      )}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        {!loading && <KeyRound className="h-4 w-4" aria-hidden />}
        Salva la nuova password
      </Button>
    </form>
  );
}
