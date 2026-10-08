"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { FormAlert, isEmail, useFieldErrors } from "@/components/forms/shared";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { afterLoginPath, withRedirect } from "./redirect";

const WRONG_CREDENTIALS = "Email o password non corretti.";

export function LoginForm() {
  const router = useRouter();
  const redirect = useSearchParams().get("redirect");
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const login = useAuth((s) => s.login);
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { errors, clear, check } = useFieldErrors<"email" | "password">();

  // Utente già autenticato (o appena entrato): alla pagina richiesta
  useEffect(() => {
    if (ready && user) router.replace(afterLoginPath(user, redirect));
  }, [ready, user, redirect, router]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const ok = check(
      {
        email: !isEmail(email) ? "Inserisci un indirizzo email valido." : undefined,
        password: !password ? "Inserisci la password." : undefined,
      },
      formRef.current
    );
    if (!ok) return;
    setLoading(true);
    try {
      const logged = await login(email, password);
      const first = logged.name?.trim().split(/\s+/)[0];
      toast.success(first ? `Bentornato, ${first}!` : "Bentornato!");
      // il reindirizzamento lo fa l'effetto qui sopra
    } catch (err) {
      const message = errorMessage(err);
      setServerError(/credenziali/i.test(message) ? WRONG_CREDENTIALS : message);
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      <Input
        label="Email"
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
      <div>
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
          }}
          error={errors.password}
        />
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">
            Password dimenticata?
          </Link>
        </div>
      </div>

      {serverError && (
        <FormAlert>
          {serverError}
          {serverError === WRONG_CREDENTIALS && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-bold underline">
                Reimposta la password
              </Link>
            </>
          )}
        </FormAlert>
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {!loading && <LogIn className="h-4 w-4" aria-hidden />}
        Accedi
      </Button>

      <p className="border-t border-paper-line pt-5 text-center text-[15px] text-ink-muted">
        Non hai ancora un account?{" "}
        <Link href={withRedirect("/register", redirect)} className="font-bold text-brand-700 hover:underline">
          Registrati gratis
        </Link>
      </p>
    </form>
  );
}
