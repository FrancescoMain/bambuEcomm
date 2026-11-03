"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, School } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { useScuoleAuth } from "@/store/scuoleAuth";

const SEZIONI = [
  { href: "/scuole", label: "Scuole" },
  { href: "/scuole/clienti", label: "Clienti" },
  { href: "/scuole/ordini", label: "Ordini" },
  { href: "/scuole/magazzino", label: "Magazzino" },
] as const;

function Accesso() {
  const login = useScuoleAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const entra = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);
    setEntrando(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrore(errorMessage(err, "Accesso non riuscito."));
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <form onSubmit={entra} className="card w-full max-w-md space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <School className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Libri scolastici</h1>
            <p className="text-sm text-ink-muted">Cartoleria Bambù</p>
          </div>
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {errore && <p className="text-sm font-semibold text-magenta-ink">{errore}</p>}
        <Button type="submit" className="w-full" disabled={entrando}>
          {entrando ? "Accesso…" : "Entra"}
        </Button>
      </form>
    </div>
  );
}

/** Gestionale libri su /scuole: un account a parte, solo questo strumento, a tutta larghezza. */
export function ScuoleShell({ children }: { children: React.ReactNode }) {
  const { user, ready, init, logout } = useScuoleAuth();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, [init]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) return <Accesso />;

  return (
    <div className="min-h-screen bg-paper text-base">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-paper-line bg-white px-4 sm:px-6 print:hidden">
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <School className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-extrabold sm:inline">Libri scolastici</span>
          </span>
          <nav className="flex gap-1">
            {SEZIONI.map((s) => {
              const attiva = s.href === "/scuole" ? pathname === s.href : pathname.startsWith(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[15px] font-bold transition",
                    attiva ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-paper-warm"
                  )}
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-warm"
        >
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </header>
      <main className="w-full p-4 sm:p-6">{children}</main>
    </div>
  );
}
