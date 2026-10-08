"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, LogIn } from "lucide-react";
import { api, errorMessage } from "@/lib/api/client";
import { plural } from "@/lib/format";
import type { ListProduct, Paginated } from "@/lib/types";
import { useAuth } from "@/store/auth";
import { useWishlist } from "@/store/wishlist";
import { ProductGrid } from "@/components/shop/ProductCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { FormAlert } from "@/components/forms/shared";

const PAGE = 100; // massimo consentito dall'API per richiesta

/** Pagina /preferiti: legge gli id salvati (ospite o utente) e mostra i prodotti */
export function WishlistView() {
  const [mounted, setMounted] = useState(false);
  const ids = useWishlist((s) => s.ids);
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  // id -> prodotto (null = non più disponibile nel catalogo)
  const [cache, setCache] = useState<Record<number, ListProduct | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setMounted(true), []);

  const missing = ids.filter((id) => !(id in cache));
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!mounted || !missingKey) return;
    let cancelled = false;
    const wanted = missingKey.split(",").map(Number);
    const chunks: number[][] = [];
    for (let i = 0; i < wanted.length; i += PAGE) chunks.push(wanted.slice(i, i + PAGE));
    setError(null);
    Promise.all(
      chunks.map((chunk) =>
        api<Paginated<ListProduct>>("/products", { auth: false, query: { ids: chunk.join(","), limit: PAGE } })
      )
    )
      .then((pages) => {
        if (cancelled) return;
        const found = new Map(pages.flatMap((p) => p.data).map((p) => [p.id, p]));
        setCache((prev) => {
          const next = { ...prev };
          for (const id of wanted) next[id] = found.get(id) ?? null;
          return next;
        });
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Non riusciamo a caricare i preferiti.")));
    return () => {
      cancelled = true;
    };
  }, [mounted, missingKey, attempt]);

  const loading = !mounted || (missing.length > 0 && !error);
  const products = ids.map((id) => cache[id]).filter((p): p is ListProduct => !!p);

  const guestNote = mounted && ready && !user && (
    <div className="flex flex-col gap-3 rounded-3xl bg-magenta-soft p-5 sm:flex-row sm:items-center">
      <Heart className="h-6 w-6 shrink-0 fill-magenta text-magenta" aria-hidden />
      <p className="flex-1 text-[15px] text-ink-soft">
        <strong className="text-ink">Salva i preferiti su tutti i tuoi dispositivi.</strong> Accedi o crea un account:
        la lista che hai qui verrà unita a quella del tuo profilo.
      </p>
      <LinkButton href="/login?redirect=/preferiti" variant="dark" size="sm" className="shrink-0">
        <LogIn className="h-4 w-4" aria-hidden /> Accedi
      </LinkButton>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Caricamento preferiti">
        {Array.from({ length: Math.min(Math.max(ids.length, 4), 8) }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error && !products.length) {
    return (
      <div className="space-y-4">
        <FormAlert>{error}</FormAlert>
        <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
          Riprova
        </Button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<Heart className="h-7 w-7" aria-hidden />}
          title="La tua lista dei preferiti è vuota"
          text={
            <>
              Tocca il cuore <Heart className="inline h-4 w-4 align-[-2px] text-magenta" aria-label="cuore" /> sui
              prodotti che ti piacciono: li ritroverai tutti qui.
            </>
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <LinkButton href="/novita">Scopri le novità</LinkButton>
              <LinkButton href="/offerte" variant="outline">
                Vedi le offerte
              </LinkButton>
            </div>
          }
          className="rounded-3xl border border-dashed border-paper-line bg-white"
        />
        {guestNote}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-ink-muted" aria-live="polite">
          {plural(products.length, "prodotto salvato", "prodotti salvati")}
        </p>
        <Link href="/prodotti" className="text-sm font-bold text-brand-700 hover:underline">
          Continua lo shopping
        </Link>
      </div>
      {guestNote}
      <ProductGrid products={products} />
    </div>
  );
}
