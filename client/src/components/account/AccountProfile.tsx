"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Heart, LayoutDashboard, LogOut, MessageCircle, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { formatDate, plural } from "@/lib/format";
import type { User } from "@/lib/types";
import { cn } from "@/lib/cn";
import { isAdmin, useAuth } from "@/store/auth";
import { useWishlist } from "@/store/wishlist";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { FormAlert, useFieldErrors } from "@/components/forms/shared";
import { MIN_PASSWORD, PasswordInput } from "@/components/forms/PasswordInput";
import { TONE, type Tone } from "@/components/content/tones";
import { signOut } from "./session";

const card = "rounded-3xl border border-paper-line bg-white p-6 sm:p-8";

function ProfileCard({ user }: { user: User }) {
  const setUser = useAuth((s) => s.setUser);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(user.name || "");
  const [saving, setSaving] = useState(false);
  const { errors, clear, check } = useFieldErrors<"name">();
  const dirty = name.trim() !== (user.name || "").trim();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!check({ name: name.trim().length < 2 ? "Inserisci un nome valido." : undefined }, formRef.current)) return;
    setSaving(true);
    try {
      const res = await api<{ message: string; user: User }>("/auth/me", { method: "PUT", body: { name: name.trim() } });
      setUser(res.user);
      setName(res.user.name || "");
      toast.success("Dati aggiornati");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={card} aria-labelledby="profilo-titolo">
      <h2 id="profilo-titolo" className="text-xl font-extrabold">
        I tuoi dati
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Il nome compare nelle email e nei riepiloghi dei tuoi ordini.</p>
      <form ref={formRef} onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome e cognome"
          name="name"
          autoComplete="name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clear("name");
          }}
          error={errors.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={user.email}
          readOnly
          disabled
          hint="Per cambiare email scrivici dalla pagina Contatti."
        />
        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          {user.createdAt ? (
            <p className="text-sm text-ink-muted">Cliente Bambù dal {formatDate(user.createdAt)}</p>
          ) : (
            <span />
          )}
          <Button type="submit" loading={saving} disabled={!dirty} className="w-full sm:w-auto">
            Salva le modifiche
          </Button>
        </div>
      </form>
    </section>
  );
}

type PwKey = "currentPassword" | "newPassword" | "confirm";

function PasswordCard({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { errors, setErrors, clear, check } = useFieldErrors<PwKey>();

  const set = (key: PwKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    clear(key);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const ok = check(
      {
        currentPassword: !values.currentPassword ? "Inserisci la password attuale." : undefined,
        newPassword:
          values.newPassword.length < MIN_PASSWORD
            ? `La nuova password deve avere almeno ${MIN_PASSWORD} caratteri.`
            : values.newPassword === values.currentPassword
              ? "La nuova password deve essere diversa da quella attuale."
              : undefined,
        confirm: values.confirm !== values.newPassword ? "Le due password non coincidono." : undefined,
      },
      formRef.current
    );
    if (!ok) return;
    setSaving(true);
    try {
      const res = await api<{ message: string }>("/auth/password", {
        method: "PUT",
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      toast.success(res.message || "Password aggiornata");
      setValues({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      const message = errorMessage(err);
      if (/attuale/i.test(message)) {
        setErrors({ currentPassword: message });
        formRef.current?.querySelector<HTMLInputElement>('input[name="currentPassword"]')?.focus();
      } else {
        setServerError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={card} aria-labelledby="password-titolo">
      <h2 id="password-titolo" className="text-xl font-extrabold">
        Cambia password
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Usa una password che non utilizzi su altri siti.</p>
      <form ref={formRef} onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* aiuta i gestori di password ad aggiornare l'account giusto */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <PasswordInput
          label="Password attuale"
          name="currentPassword"
          autoComplete="current-password"
          required
          value={values.currentPassword}
          onChange={set("currentPassword")}
          error={errors.currentPassword}
          className="sm:col-span-2 sm:w-1/2 sm:pr-2"
        />
        <PasswordInput
          label="Nuova password"
          name="newPassword"
          autoComplete="new-password"
          required
          meter
          value={values.newPassword}
          onChange={set("newPassword")}
          error={errors.newPassword}
        />
        <PasswordInput
          label="Ripeti la nuova password"
          name="confirm"
          autoComplete="new-password"
          required
          value={values.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        {serverError && <FormAlert className="sm:col-span-2">{serverError}</FormAlert>}
        <div className="sm:col-span-2 sm:text-right">
          <Button type="submit" variant="dark" loading={saving} className="w-full sm:w-auto">
            Aggiorna la password
          </Button>
        </div>
      </form>
    </section>
  );
}

function QuickLink({
  href,
  title,
  text,
  icon: Icon,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ElementType;
  tone: Tone;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-paper">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE[tone].soft)}>
          <Icon className={cn("h-5 w-5", TONE[tone].icon)} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-tight">{title}</span>
          <span className="block truncate text-sm text-ink-muted">{text}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 text-ink-faint transition group-hover:text-ink" aria-hidden />
      </Link>
    </li>
  );
}

/** Pagina /account: dati del profilo, password e scorciatoie */
export function AccountProfile() {
  const user = useAuth((s) => s.user);
  const wishCount = useWishlist((s) => s.ids.length);
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <ProfileCard user={user} />
        <PasswordCard email={user.email} />
      </div>

      <aside className="space-y-4">
        {isAdmin(user) && (
          <div className="rounded-3xl bg-ink p-6 text-white">
            <LayoutDashboard className="h-6 w-6 text-brand-300" aria-hidden />
            <h2 className="mt-3 text-lg font-extrabold text-white">Pannello negozio</h2>
            <p className="mt-1 text-sm text-white/70">Ordini, prodotti, contenuti e impostazioni del sito.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-ink transition hover:bg-brand-50"
            >
              Vai al pannello
            </Link>
          </div>
        )}
        <nav aria-label="Collegamenti rapidi" className="rounded-3xl border border-paper-line bg-white p-3">
          <ul className="space-y-1">
            <QuickLink href="/account/ordini" title="I miei ordini" text="Stato, tracking e annullamento" icon={Package} tone="sky" />
            <QuickLink
              href="/preferiti"
              title="Preferiti"
              text={wishCount ? plural(wishCount, "prodotto salvato", "prodotti salvati") : "Salva ciò che ti piace"}
              icon={Heart}
              tone="magenta"
            />
            <QuickLink href="/recesso" title="Recesso online" text="Restituisci un articolo" icon={RotateCcw} tone="orange" />
            <QuickLink href="/contatti" title="Assistenza" text="Scrivici o chiamaci" icon={MessageCircle} tone="leaf" />
          </ul>
        </nav>
        <Button variant="outline" className="w-full" onClick={() => signOut((path) => router.push(path))}>
          <LogOut className="h-4 w-4" aria-hidden /> Esci dall&apos;account
        </Button>
        <p className="px-2 text-center text-xs text-ink-muted">
          Vuoi cancellare l&apos;account e i tuoi dati?{" "}
          <Link href="/contatti" className="font-semibold underline underline-offset-2 hover:text-ink">
            Scrivici
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
