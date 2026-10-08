"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Spinner";
import { api, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { Paginated } from "@/lib/types";
import { BulkDiscountModal, type BulkDiscountTarget } from "../BulkDiscountModal";
import { useCategories } from "../categories";
import { DiscountModal } from "../DiscountModal";
import { ProductThumb } from "../ProductThumb";
import type { AdminListProduct, DiscountTarget, ProductMutationResponse } from "../types";
import { formatShortDate, mergePricing, pluralize, roundMoney } from "../utils";
import type { Loadable } from "./PromotionsPage";

/** Prodotti con uno sconto attivo adesso, con modifica e rimozione rapide */
export function SaleProductsTab({ state }: { state: Loadable<Paginated<AdminListProduct>> }) {
  const { data, error, reload, setData } = state;
  const { flat: categories } = useCategories();
  const [confirm, confirmDialog] = useConfirm();
  const [editing, setEditing] = useState<DiscountTarget | null>(null);
  const [bulk, setBulk] = useState<BulkDiscountTarget | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const products = data?.data ?? [];

  const remove = async (p: AdminListProduct) => {
    const ok = await confirm({
      title: "Togliere lo sconto?",
      message: (
        <>
          <strong className="text-ink">{p.titolo}</strong> tornerà al prezzo pieno di {formatPrice(p.prezzo)}.
        </>
      ),
      confirmLabel: "Togli sconto",
      danger: true,
    });
    if (!ok) return;
    setRemoving(p.id);
    try {
      await api<ProductMutationResponse>(`/products/${p.id}/discount`, { method: "PATCH", body: { remove: true } });
      revalidateStorefront(["products", `product:${p.id}`]);
      toast.success("Sconto tolto: il prodotto torna al prezzo pieno.");
      setData((d) => (d ? { ...d, data: d.data.filter((x) => x.id !== p.id), totalProducts: d.totalProducts - 1 } : d));
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile togliere lo sconto."));
    } finally {
      setRemoving(null);
    }
  };

  const onSaved = (updated: DiscountTarget) => {
    if (!updated.inOfferta) {
      // Sconto tolto o spostato nel futuro: non è più "in offerta adesso"
      reload();
      return;
    }
    setData((d) => (d ? { ...d, data: d.data.map((p) => (p.id === updated.id ? mergePricing(p, updated) : p)) } : d));
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-ink-soft">
          {data
            ? data.totalProducts
              ? `${pluralize(data.totalProducts, "prodotto è in offerta", "prodotti sono in offerta")} in questo momento.`
              : "Nessun prodotto è in offerta in questo momento."
            : "Caricamento…"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulk({ kind: "category", categoryId: null })}>
            <BadgePercent className="h-4 w-4 text-magenta" /> Sconto su categoria
          </Button>
          <LinkButton href="/dashboard/prodotti?sconto=1" variant="sale">
            <Plus className="h-4 w-4" /> Aggiungi sconti
          </LinkButton>
        </div>
      </div>

      {error && !data ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={reload}>
            Riprova
          </Button>
        </div>
      ) : !data ? (
        <div className="card divide-y divide-paper-line" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BadgePercent className="h-7 w-7" />}
            title="Nessun prodotto in offerta"
            text="Vai ai prodotti e premi «Sconto» su quello che vuoi scontare: in un attimo comparirà qui."
            action={
              <LinkButton href="/dashboard/prodotti?sconto=1" variant="sale">
                <Plus className="h-4 w-4" /> Aggiungi sconti
              </LinkButton>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1fr)_200px_170px_200px] gap-4 border-b border-paper-line bg-paper/60 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-muted lg:grid">
            <span>Prodotto</span>
            <span>Prezzo</span>
            <span>Periodo</span>
            <span className="sr-only">Azioni</span>
          </div>
          <ul className="divide-y divide-paper-line">
            {products.map((p) => (
              <li
                key={p.id}
                className="grid gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_200px_170px_200px] lg:items-center lg:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={p.immagine} size={52} dimmed={!p.available} />
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/prodotti/${p.id}`}
                      className="line-clamp-2 text-[15px] font-semibold leading-snug hover:text-brand-700"
                    >
                      {p.titolo}
                    </Link>
                    <p className="truncate text-xs text-ink-muted">
                      {p.categoria.map((c) => c.name).join(", ")}
                      {!p.available && " · Esaurito"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 lg:block">
                  <Price prezzo={p.prezzo} prezzoFinale={p.prezzoFinale} scontoPercentuale={p.scontoPercentuale} size="sm" showBadge />
                  <p className="text-xs text-ink-muted">Risparmio {formatPrice(roundMoney(p.prezzo - p.prezzoFinale))}</p>
                </div>
                <div className="text-sm text-ink-soft">
                  {p.scontoFine ? (
                    <span>
                      Fino al <strong className="text-ink">{formatShortDate(p.scontoFine)}</strong>
                    </span>
                  ) : (
                    <span>Senza scadenza</span>
                  )}
                  {p.scontoInizio && <span className="block text-xs text-ink-muted">dal {formatShortDate(p.scontoInizio)}</span>}
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5" /> Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-magenta-ink hover:bg-magenta-soft"
                    onClick={() => void remove(p)}
                    loading={removing === p.id}
                    disabled={removing !== null}
                  >
                    {removing !== p.id && <Trash2 className="h-3.5 w-3.5" />} Togli
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {data.totalProducts > products.length && (
            <p className="border-t border-paper-line px-5 py-3 text-sm text-ink-muted">
              Mostrati i primi {products.length} su {data.totalProducts}.{" "}
              <Link href="/dashboard/prodotti?offerta=1" className="font-semibold text-brand-600">
                Vedi tutti nella lista prodotti
              </Link>
            </p>
          )}
        </div>
      )}
      <p className="mt-3 text-sm text-ink-muted">
        Gli sconti programmati per il futuro compaiono qui dal giorno in cui partono. Li trovi anche nella lista prodotti,
        con l&apos;etichetta «Programmato».
      </p>

      <DiscountModal product={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      <BulkDiscountModal target={bulk} categories={categories} onClose={() => setBulk(null)} onDone={reload} />
      {confirmDialog}
    </div>
  );
}
