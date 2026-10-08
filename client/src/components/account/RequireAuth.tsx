"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui/Spinner";
import { isSigningOut } from "./session";

/** Mostra il contenuto solo agli utenti autenticati; gli altri vanno al login */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user && !isSigningOut()) {
      // conserva anche la query (es. il link "collega ordini" ricevuto via email)
      router.replace(`/login?redirect=${encodeURIComponent(pathname + window.location.search)}`);
    }
  }, [ready, user, pathname, router]);

  if (!ready || !user) {
    return (
      <div className="grid gap-5 lg:grid-cols-3" aria-busy="true" aria-label="Caricamento">
        <Skeleton className="h-72 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  return <>{children}</>;
}
