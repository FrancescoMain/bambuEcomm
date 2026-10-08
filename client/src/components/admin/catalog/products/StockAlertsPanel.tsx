"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { ProductThumb } from "../ProductThumb";
import type { StockAlertGroup } from "../types";
import { pluralize } from "../utils";

const DISMISS_KEY = "bambu-admin:avvisi-nascosti";

/**
 * Clienti che hanno chiesto "Avvisami quando torna disponibile".
 * Rendere disponibile il prodotto invia subito l'email a chi aspetta.
 */
export function StockAlertsPanel({
  forceOpen,
  refreshKey = 0,
  onMadeAvailable,
}: {
  forceOpen?: boolean;
  /** Cambiare il valore ricarica le richieste (es. dopo un cambio di disponibilità) */
  refreshKey?: number;
  onMadeAvailable?: (productId: number) => void;
}) {
  const [groups, setGroups] = useState<StockAlertGroup[]>([]);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY));
    } catch {
      // storage non disponibile: il pannello resta visibile
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api<StockAlertGroup[]>("/products/stock-alerts/pending")
      .then((rows) => alive && setGroups(Array.isArray(rows) ? rows.filter((g) => g.product) : []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  // Firma delle richieste: se arrivano nuove richieste il pannello riappare
  const signature = useMemo(() => groups.map((g) => `${g.product?.id}:${g.richieste}`).join("|"), [groups]);
  const waiting = groups.filter((g) => g.product && !g.product.available);
  const total = groups.reduce((sum, g) => sum + g.richieste, 0);

  if (!groups.length || (!forceOpen && dismissed === signature)) return null;

  const dismiss = () => {
    setDismissed(signature);
    try {
      localStorage.setItem(DISMISS_KEY, signature);
    } catch {
      // ignora
    }
  };

  const makeAvailable = async (group: StockAlertGroup) => {
    const product = group.product;
    if (!product) return;
    setBusy(product.id);
    try {
      await api(`/products/${product.id}/availability`, { method: "PATCH", body: { available: true } });
      revalidateStorefront(["products", `product:${product.id}`]);
      toast.success(
        `«${product.titolo.slice(0, 40)}» è di nuovo in vendita: ${pluralize(group.richieste, "cliente riceverà", "clienti riceveranno")} un'email.`
      );
      setGroups((prev) => prev.filter((g) => g.product?.id !== product.id));
      onMadeAvailable?.(product.id);
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile rendere disponibile il prodotto."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="avvisi-title"
      className="mb-4 overflow-hidden rounded-2xl border border-sky/30 bg-sky-soft"
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-ink">
          <BellRing className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="avvisi-title" className="text-base font-bold text-ink">
            {pluralize(total, "cliente aspetta", "clienti aspettano")} {groups.length === 1 ? "questo prodotto" : "questi prodotti"}
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Hanno chiesto di essere avvisati quando tornano disponibili. Appena rendi disponibile un prodotto ricevono
            subito un&apos;email.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-mr-1 -mt-1 rounded-full p-2 text-ink-muted transition hover:bg-white hover:text-ink"
          aria-label="Nascondi avvisi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-sky/15 border-t border-sky/20 bg-white/70">
        {groups.map((g) => {
          const p = g.product!;
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <ProductThumb src={p.immagine} size={40} />
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/prodotti/${p.id}`} className="line-clamp-1 text-sm font-semibold hover:text-brand-700">
                  {p.titolo}
                </Link>
                <p className="text-xs text-ink-muted">{pluralize(g.richieste, "richiesta", "richieste")} in attesa</p>
              </div>
              {p.available ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700" title="Il prodotto è già in vendita">
                  <Check className="h-4 w-4" /> Già disponibile
                </span>
              ) : (
                <Button size="sm" onClick={() => makeAvailable(g)} loading={busy === p.id} disabled={busy !== null}>
                  Rendi disponibile
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {waiting.length < groups.length && (
        <p className="border-t border-sky/20 bg-white/70 px-4 py-2.5 text-xs text-ink-muted sm:px-5">
          L&apos;email parte in automatico quando un prodotto passa da esaurito a disponibile: per quelli già in vendita
          puoi segnarli come esauriti e poi di nuovo disponibili per inviare l&apos;avviso.
        </p>
      )}
    </section>
  );
}
