"use client";

import { useState } from "react";
import { Copy, Info, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { api, errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCategories } from "../categories";
import { Switch } from "../Switch";
import type { Coupon } from "../types";
import { COUPON_STATE, couponState, couponValidity, couponValue } from "./couponUtils";
import { CouponModal } from "./CouponModal";
import type { Loadable } from "./PromotionsPage";

/** Codici sconto: elenco, attivazione rapida, creazione e modifica */
export function CouponsTab({ state }: { state: Loadable<Coupon[]> }) {
  const { data, error, reload, setData } = state;
  const { flat: categories } = useCategories();
  const [confirm, confirmDialog] = useConfirm();
  const [editing, setEditing] = useState<{ coupon: Coupon | null } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const toggleActive = async (c: Coupon, attivo: boolean) => {
    setBusy(c.id);
    setData((list) => list?.map((x) => (x.id === c.id ? { ...x, attivo } : x)) ?? list);
    try {
      await api(`/coupons/${c.id}`, { method: "PUT", body: { attivo } });
      toast.success(attivo ? `Codice ${c.codice} attivato.` : `Codice ${c.codice} sospeso.`);
    } catch (e) {
      setData((list) => list?.map((x) => (x.id === c.id ? { ...x, attivo: !attivo } : x)) ?? list);
      toast.error(errorMessage(e, "Non è stato possibile aggiornare il codice."));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: Coupon) => {
    const ok = await confirm({
      title: `Eliminare il codice ${c.codice}?`,
      message:
        c.utilizzi > 0
          ? `È già stato usato ${c.utilizzi} ${c.utilizzi === 1 ? "volta" : "volte"}. Se vuoi solo sospenderlo, spegni l'interruttore «Attivo».`
          : "I clienti non potranno più usarlo.",
      confirmLabel: "Elimina codice",
      danger: true,
    });
    if (!ok) return;
    setBusy(c.id);
    try {
      await api(`/coupons/${c.id}`, { method: "DELETE" });
      toast.success("Codice sconto eliminato.");
      setData((list) => list?.filter((x) => x.id !== c.id) ?? list);
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile eliminare il codice."));
    } finally {
      setBusy(null);
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Codice ${code} copiato: puoi incollarlo in un messaggio o su Instagram.`);
    } catch {
      toast.error("Copia non riuscita: seleziona il codice e copialo a mano.");
    }
  };

  const restriction = (c: Coupon) => {
    const parts = [
      ...c.categorie.map((x) => x.name),
      ...c.prodotti.map((x) => (x.titolo.length > 28 ? `${x.titolo.slice(0, 26)}…` : x.titolo)),
    ];
    if (!parts.length) return "Tutto il carrello";
    return parts.length > 2 ? `${parts.slice(0, 2).join(", ")} +${parts.length - 2}` : parts.join(", ");
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-2xl items-start gap-3 rounded-2xl bg-sky-soft p-4 text-sm text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-ink" />
          <p>
            <strong className="text-ink">Come funzionano:</strong> crea un codice (es. SCUOLA10) e comunicalo ai clienti. Lo
            scrivono nel <strong>carrello</strong>, prima di pagare, e lo sconto si applica da solo.
          </p>
        </div>
        <Button onClick={() => setEditing({ coupon: null })} className="shrink-0">
          <Plus className="h-4 w-4" /> Nuovo codice sconto
        </Button>
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Ticket className="h-7 w-7" />}
            title="Nessun codice sconto"
            text="Crea il primo codice: ad esempio BENVENUTO10 per il 10% sul primo ordine."
            action={
              <Button onClick={() => setEditing({ coupon: null })}>
                <Plus className="h-4 w-4" /> Crea un codice
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_100px_minmax(0,1.2fr)_110px_minmax(0,1fr)_90px_88px] gap-4 border-b border-paper-line bg-paper/60 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-muted xl:grid">
            <span>Codice</span>
            <span>Sconto</span>
            <span>Condizioni</span>
            <span>Utilizzi</span>
            <span>Validità</span>
            <span>Attivo</span>
            <span className="sr-only">Azioni</span>
          </div>
          <ul className="divide-y divide-paper-line">
            {data.map((c) => {
              const st = COUPON_STATE[couponState(c)];
              const usage = c.maxUtilizzi ? Math.min(100, (c.utilizzi / c.maxUtilizzi) * 100) : null;
              return (
                <li
                  key={c.id}
                  className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1.3fr)_100px_minmax(0,1.2fr)_110px_minmax(0,1fr)_90px_88px] xl:items-center"
                >
                  <div className="col-span-2 min-w-0 xl:col-span-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate rounded-lg bg-paper-warm px-2.5 py-1 font-mono text-[15px] font-bold tracking-wider text-ink">
                        {c.codice}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copy(c.codice)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper-warm hover:text-ink"
                        aria-label={`Copia il codice ${c.codice}`}
                        title="Copia codice"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold uppercase xl:hidden", st.tone)}>
                        {st.label}
                      </span>
                    </div>
                    {c.nome && c.nome !== c.codice && <p className="mt-1 truncate text-xs text-ink-muted">{c.nome}</p>}
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted xl:hidden">Sconto</span>
                    <p className="text-lg font-extrabold text-magenta-ink">{couponValue(c.tipo, c.valore)}</p>
                  </div>
                  <div className="min-w-0 text-sm text-ink-soft">
                    <span className="text-xs text-ink-muted xl:hidden">Condizioni</span>
                    <p className="truncate" title={restriction(c)}>
                      {restriction(c)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {c.minimoOrdine ? `Spesa minima ${formatPrice(c.minimoOrdine)}` : "Nessuna spesa minima"}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-ink-muted xl:hidden">Utilizzi</span>
                    <p className="font-semibold">
                      {c.utilizzi}
                      <span className="font-normal text-ink-muted"> / {c.maxUtilizzi ?? "∞"}</span>
                    </p>
                    {usage !== null && (
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-paper-warm" aria-hidden>
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${usage}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-ink-soft">
                    <span className="text-xs text-ink-muted xl:hidden">Validità</span>
                    <p className="first-letter:uppercase">{couponValidity(c)}</p>
                    <span className={cn("mt-1 hidden rounded-full px-2 py-0.5 text-[11px] font-bold uppercase xl:inline-block", st.tone)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.attivo}
                      onChange={(v) => void toggleActive(c, v)}
                      loading={busy === c.id}
                      srLabel={`Codice ${c.codice} attivo`}
                    />
                    <span className="text-xs font-semibold text-ink-muted xl:hidden">{c.attivo ? "Attivo" : "Sospeso"}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing({ coupon: c })}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink"
                      aria-label={`Modifica il codice ${c.codice}`}
                      title="Modifica"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(c)}
                      disabled={busy === c.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-magenta-soft hover:text-magenta-ink disabled:opacity-50"
                      aria-label={`Elimina il codice ${c.codice}`}
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <CouponModal
        open={!!editing}
        coupon={editing?.coupon ?? null}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={reload}
      />
      {confirmDialog}
    </div>
  );
}
