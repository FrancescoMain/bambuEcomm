"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, ApiError, errorMessage, revalidateStorefront } from "@/lib/api/client";
import type { ProductMutationResponse } from "../types";

type ConfirmFn = (opts: {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) => Promise<boolean>;

type MinimalProduct = { id: number; titolo: string; available: boolean; inEvidenza: boolean };

const short = (title: string) => (title.length > 48 ? `${title.slice(0, 46).trim()}…` : title);

/**
 * Azioni rapide su un prodotto (disponibilità, evidenza, eliminazione).
 * Gli interruttori aggiornano subito la UI e tornano indietro se l'API fallisce.
 */
export function useProductActions({
  confirm,
  onPatch,
  onRemoved,
}: {
  confirm: ConfirmFn;
  onPatch: (id: number, patch: Partial<MinimalProduct>) => void;
  onRemoved?: (id: number) => void;
}) {
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const mark = (key: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const setAvailable = useCallback(
    async (p: MinimalProduct, available: boolean) => {
      const key = `${p.id}:available`;
      mark(key, true);
      onPatch(p.id, { available });
      try {
        await api<ProductMutationResponse>(`/products/${p.id}/availability`, { method: "PATCH", body: { available } });
        revalidateStorefront(["products", `product:${p.id}`]);
        toast.success(
          available ? `«${short(p.titolo)}» è di nuovo in vendita.` : `«${short(p.titolo)}» ora risulta esaurito.`
        );
        return true;
      } catch (e) {
        onPatch(p.id, { available: !available });
        toast.error(errorMessage(e, "Non è stato possibile cambiare la disponibilità."));
        return false;
      } finally {
        mark(key, false);
      }
    },
    [onPatch]
  );

  const setFeatured = useCallback(
    async (p: MinimalProduct, inEvidenza: boolean) => {
      const key = `${p.id}:featured`;
      mark(key, true);
      onPatch(p.id, { inEvidenza });
      try {
        await api("/products/bulk", { method: "PATCH", body: { productIds: [p.id], inEvidenza } });
        revalidateStorefront(["products", `product:${p.id}`]);
        toast.success(inEvidenza ? "Aggiunto ai prodotti in evidenza della home." : "Tolto dai prodotti in evidenza.");
      } catch (e) {
        onPatch(p.id, { inEvidenza: !inEvidenza });
        toast.error(errorMessage(e, "Non è stato possibile aggiornare il prodotto."));
      } finally {
        mark(key, false);
      }
    },
    [onPatch]
  );

  /** Elimina con conferma. Se il prodotto è già stato ordinato propone di renderlo non disponibile. */
  const remove = useCallback(
    async (p: MinimalProduct) => {
      const ok = await confirm({
        title: "Eliminare il prodotto?",
        message: (
          <>
            <strong className="text-ink">{p.titolo}</strong> verrà eliminato definitivamente dal catalogo. L&apos;operazione
            non si può annullare.
          </>
        ),
        confirmLabel: "Elimina",
        danger: true,
      });
      if (!ok) return false;
      const key = `${p.id}:delete`;
      mark(key, true);
      try {
        await api(`/products/${p.id}`, { method: "DELETE" });
        revalidateStorefront(["products", `product:${p.id}`]);
        toast.success("Prodotto eliminato.");
        onRemoved?.(p.id);
        return true;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          if (!p.available) {
            toast.info(`${e.message} Il prodotto è già non disponibile, quindi nessuno può acquistarlo.`, {
              duration: 8000,
            });
            return false;
          }
          const hide = await confirm({
            title: "Questo prodotto non si può eliminare",
            message: (
              <>
                <p>{e.message}</p>
                <p className="mt-2">
                  Rendendolo non disponibile resterà nello storico degli ordini, ma i clienti non potranno più
                  acquistarlo.
                </p>
              </>
            ),
            confirmLabel: "Rendi non disponibile",
          });
          if (hide) await setAvailable(p, false);
        } else {
          toast.error(errorMessage(e, "Non è stato possibile eliminare il prodotto."));
        }
        return false;
      } finally {
        mark(key, false);
      }
    },
    [confirm, onRemoved, setAvailable]
  );

  const isBusy = useCallback((id: number, what: "available" | "featured" | "delete") => busy.has(`${id}:${what}`), [busy]);

  return { setAvailable, setFeatured, remove, isBusy };
}
