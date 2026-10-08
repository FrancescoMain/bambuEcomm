"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleX,
  CreditCard,
  ExternalLink,
  Info,
  Link2,
  Package,
  RefreshCw,
  RotateCcw,
  Store,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, formatDate, formatDateTime, formatPrice, plural, toNumber } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { productPath, whatsappUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";
import { useAuth } from "@/store/auth";
import { Button, LinkButton, buttonClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { FormAlert } from "@/components/forms/shared";
import { WhatsAppIcon } from "@/components/shop/icons";

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;
const FLOW = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const trackingUrl = (n: string) => `https://gls-group.eu/IT/it/ricerca-spedizione?match=${encodeURIComponent(n)}`;
const cancelDeadline = (o: Order) => new Date(o.createdAt).getTime() + CANCEL_WINDOW_MS;
const inCancelWindow = (o: Order) => (o.status === "PROCESSING" || o.status === "PENDING") && Date.now() < cancelDeadline(o);
const isPickup = (o: Order) => o.metodoConsegna === "ritiro";

/** Etichetta dello stato, adattata al ritiro in negozio */
const statusLabel = (o: Order) => {
  if (isPickup(o) && o.status === "SHIPPED") return "Pronto per il ritiro";
  if (isPickup(o) && o.status === "DELIVERED") return "Ritirato";
  return ORDER_STATUS_LABEL[o.status] || o.status;
};

const itemTitle = (i: OrderItem) => i.titolo || i.product?.titolo || "Prodotto";
const itemImage = (i: OrderItem) =>
  Object.values(i.selectedVariants || {}).find((v) => v?.immagine)?.immagine || i.product?.immagine || null;
const variantText = (i: OrderItem) =>
  Object.values(i.selectedVariants || {})
    .map((v) => v?.nome)
    .filter(Boolean)
    .join(" · ");

function StatusBadge({ order }: { order: Order }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold leading-none",
        ORDER_STATUS_TONE[order.status] || "bg-paper-warm text-ink-soft"
      )}
    >
      {statusLabel(order)}
    </span>
  );
}

function Progress({ order }: { order: Order }) {
  const current = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  if (current < 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-magenta-soft p-4 text-sm text-magenta-ink">
        <CircleX className="h-5 w-5 shrink-0" aria-hidden />
        <p>
          {order.status === "REFUNDED"
            ? "Ordine annullato e rimborsato: l'importo torna sul metodo di pagamento usato entro 5-10 giorni lavorativi."
            : order.status === "FAILED"
              ? "Il pagamento non è andato a buon fine: l'ordine non è stato elaborato."
              : "Questo ordine è stato annullato."}
        </p>
      </div>
    );
  }
  const labels = ["Ricevuto", "In preparazione", isPickup(order) ? "Pronto per il ritiro" : "Spedito", isPickup(order) ? "Ritirato" : "Consegnato"];
  return (
    <ol className="grid grid-cols-4" aria-label="Avanzamento dell'ordine">
      {labels.map((label, i) => {
        const done = i <= current;
        return (
          <li key={label} className="relative flex flex-col items-center text-center" aria-current={i === current ? "step" : undefined}>
            {i > 0 && (
              <span
                className={cn("absolute right-1/2 top-[13px] h-0.5 w-full", i <= current ? "bg-brand-500" : "bg-paper-line")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                done ? "border-brand-500 bg-brand-500 text-white" : "border-paper-line bg-white text-ink-faint"
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("mt-2 text-[11px] font-semibold leading-tight sm:text-xs", done ? "text-ink" : "text-ink-faint")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Totals({ order }: { order: Order }) {
  const items = order.orderItems.reduce((s, i) => s + toNumber(i.priceAtPurchase) * i.quantity, 0);
  const subtotale = order.subtotale !== null ? toNumber(order.subtotale) : items;
  const sconto = toNumber(order.sconto);
  const spedizione = toNumber(order.costoSpedizione);
  const commissione = toNumber(order.commissionePagamento);
  const row = "flex justify-between gap-4";
  return (
    <dl className="space-y-2 text-sm">
      <div className={row}>
        <dt className="text-ink-muted">Subtotale</dt>
        <dd className="font-semibold">{formatPrice(subtotale)}</dd>
      </div>
      {sconto > 0 && (
        <div className={cn(row, "text-magenta-ink")}>
          <dt>Sconto{order.codiceCoupon ? ` (${order.codiceCoupon})` : ""}</dt>
          <dd className="font-semibold">-{formatPrice(sconto)}</dd>
        </div>
      )}
      {order.costoSpedizione !== null && (
        <div className={row}>
          <dt className="text-ink-muted">{isPickup(order) ? "Ritiro in negozio" : "Spedizione"}</dt>
          <dd className="font-semibold">{spedizione > 0 ? formatPrice(spedizione) : "Gratis"}</dd>
        </div>
      )}
      {commissione > 0 && (
        <div className={row}>
          <dt className="text-ink-muted">Commissione contrassegno</dt>
          <dd className="font-semibold">{formatPrice(commissione)}</dd>
        </div>
      )}
      <div className={cn(row, "border-t border-paper-line pt-3 text-base")}>
        <dt className="font-bold">Totale</dt>
        <dd className="font-extrabold">{formatPrice(order.totalAmount)}</dd>
      </div>
    </dl>
  );
}

function Delivery({ order, storeAddress }: { order: Order; storeAddress: string }) {
  const name = [order.nome, order.cognome].filter(Boolean).join(" ");
  const Icon = isPickup(order) ? Store : order.metodoConsegna === "giornata" ? Zap : Truck;
  const title = isPickup(order)
    ? "Ritiro in negozio"
    : order.metodoConsegna === "giornata"
      ? "Consegna in giornata"
      : "Spedizione a domicilio";
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
      <div className="text-sm">
        <p className="font-bold">{title}</p>
        {isPickup(order) ? (
          <p className="text-ink-soft">{storeAddress}</p>
        ) : (
          <address className="not-italic text-ink-soft">
            {name && <span className="block">{name}</span>}
            {(order.via || order.numero) && <span className="block">{[order.via, order.numero].filter(Boolean).join(" ")}</span>}
            {(order.cap || order.citta) && <span className="block">{[order.cap, order.citta].filter(Boolean).join(" ")}</span>}
            {order.stato && <span className="block">{order.stato}</span>}
          </address>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  open,
  onToggle,
  userId,
  whatsapp,
  storeAddress,
  onCancel,
  onClaim,
  claiming,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
  userId: number;
  whatsapp: string;
  storeAddress: string;
  onCancel: (order: Order) => void;
  onClaim: () => void;
  claiming: boolean;
}) {
  const count = order.orderItems.reduce((s, i) => s + i.quantity, 0);
  const guest = order.userId === null;
  const cancellable = inCancelWindow(order) && order.userId === userId;
  const canWithdraw =
    order.status === "SHIPPED" || order.status === "DELIVERED" || (order.status === "PROCESSING" && !inCancelWindow(order));
  const panelId = `ordine-${order.id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-paper-line bg-white transition hover:shadow-card">
      <h2 className="sr-only">Ordine numero {order.id}</h2>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 p-5 text-left sm:flex-nowrap sm:p-6"
      >
        <span className="block min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap text-lg font-extrabold">Ordine #{order.id}</span>
            <StatusBadge order={order} />
          </span>
          <span className="mt-1 block text-sm text-ink-muted">
            {formatDate(order.createdAt)} · {plural(count, "articolo", "articoli")}
          </span>
        </span>
        <span className="hidden items-center -space-x-3 sm:flex" aria-hidden>
          {order.orderItems.slice(0, 3).map((item) => {
            const src = itemImage(item);
            return (
              <span key={item.id} className="relative h-11 w-11 overflow-hidden rounded-xl border-2 border-white bg-paper-warm">
                {src && <Image src={src} alt="" fill sizes="44px" className="object-contain p-0.5" />}
              </span>
            );
          })}
          {order.orderItems.length > 3 && (
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-paper-warm text-xs font-bold text-ink-soft">
              +{order.orderItems.length - 3}
            </span>
          )}
        </span>
        <span className="text-lg font-extrabold">{formatPrice(order.totalAmount)}</span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
        <span className="sr-only">{open ? "Nascondi i dettagli" : "Mostra i dettagli"}</span>
      </button>

      {open && (
        <div id={panelId} className="animate-fade-in border-t border-paper-line">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6">
              <Progress order={order} />

              <ul className="divide-y divide-paper-line">
                {order.orderItems.map((item) => {
                  const src = itemImage(item);
                  const price = toNumber(item.priceAtPurchase);
                  const listino = toNumber(item.prezzoListino);
                  const variants = variantText(item);
                  return (
                    <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-paper-line bg-white">
                        {src ? (
                          <Image src={src} alt="" fill sizes="64px" className="object-contain p-1" />
                        ) : (
                          <Package className="m-auto mt-5 h-6 w-6 text-ink-faint" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={productPath({ id: item.productId, titolo: item.product?.titolo || itemTitle(item) })}
                          className="line-clamp-2 font-semibold leading-snug hover:text-brand-700"
                        >
                          {itemTitle(item)}
                        </Link>
                        {variants && <p className="mt-0.5 text-sm text-ink-muted">{variants}</p>}
                        {item.personalizzazione && (
                          <p className="mt-0.5 text-sm text-ink-muted">
                            Personalizzazione: <span className="font-semibold text-ink-soft">“{item.personalizzazione}”</span>
                          </p>
                        )}
                        <p className="mt-1 text-sm text-ink-muted">
                          {item.quantity} × {formatPrice(price)}
                          {listino > price && <s className="ml-1.5 text-ink-faint">{formatPrice(listino)}</s>}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold">{formatPrice(price * item.quantity)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl bg-paper p-4">
                <Totals order={order} />
              </div>
              <Delivery order={order} storeAddress={storeAddress} />
              {order.metodoPagamento && (
                <div className="flex gap-3 text-sm">
                  <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                  <div>
                    <p className="font-bold">Pagamento</p>
                    <p className="text-ink-soft">
                      {order.metodoPagamento === "contrassegno" ? "Contrassegno, alla consegna" : "Carta, Apple Pay o Google Pay"}
                    </p>
                  </div>
                </div>
              )}
              {order.trackingNumber && (
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm">
                  <p className="font-bold text-brand-800">Tracking spedizione</p>
                  <p className="mt-0.5 break-all font-mono text-ink-soft">{order.trackingNumber}</p>
                  <a
                    href={trackingUrl(order.trackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("primary", "sm", "mt-3")}
                  >
                    Traccia il pacco <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              )}
              {order.note && (
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink-soft">Note:</span> {order.note}
                </p>
              )}
            </aside>
          </div>

          <div className="flex flex-col gap-3 border-t border-paper-line bg-paper/60 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:p-6">
            <p className="text-xs text-ink-muted sm:mr-auto">Ordinato il {formatDateTime(order.createdAt)}</p>
            {cancellable && (
              <Button
                variant="outline"
                size="sm"
                className="text-magenta-ink hover:border-magenta"
                onClick={() => onCancel(order)}
              >
                <CircleX className="h-4 w-4" aria-hidden /> Annulla ordine
              </Button>
            )}
            {guest && inCancelWindow(order) && (
              <Button variant="outline" size="sm" loading={claiming} onClick={onClaim}>
                <Link2 className="h-4 w-4" aria-hidden /> Collega per poterlo annullare
              </Button>
            )}
            {canWithdraw && (
              <LinkButton href={`/recesso?ordine=${order.id}`} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" aria-hidden /> Richiedi il recesso
              </LinkButton>
            )}
            {whatsapp && (
              <a
                href={whatsappUrl(whatsapp, `Ciao! Ho bisogno di aiuto con l'ordine #${order.id}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("ghost", "sm")}
              >
                <WhatsAppIcon className="h-4 w-4 text-[#1faa53]" /> Serve aiuto?
              </a>
            )}
          </div>
          {cancellable && (
            <p className="border-t border-paper-line px-5 py-3 text-xs text-ink-muted sm:px-6">
              Puoi annullare l&apos;ordine fino al {formatDateTime(new Date(cancelDeadline(order)))}, se non è ancora stato
              spedito. Se hai pagato con carta, il rimborso parte in automatico.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/** Pagina /account/ordini */
export function OrdersList({
  whatsapp,
  storeAddress,
  giorniReso,
}: {
  whatsapp: string;
  storeAddress: string;
  giorniReso: number;
}) {
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [claiming, setClaiming] = useState(false);
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (first = false) => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await api<Order[]>("/orders/my-orders");
      setOrders(list);
      // il primo ordine è aperto per vedere subito stato e tracking
      if (first && list[0]) setOpenIds(new Set([list[0].id]));
    } catch (err) {
      setError(errorMessage(err, "Non riusciamo a caricare i tuoi ordini."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Collegamento ordini da ospite in due passi: email con link → conferma (prova che l'email è tua)
  const claim = async () => {
    setClaiming(true);
    try {
      const res = await api<{ message: string }>("/orders/claim-guest-orders/request", { method: "POST" });
      toast.success("Controlla la tua email", { description: res.message });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("collega");
    if (!token || !user) return;
    window.history.replaceState(null, "", window.location.pathname);
    setClaiming(true);
    api<{ message: string; claimedOrders: number }>("/orders/claim-guest-orders", { method: "POST", body: { token } })
      .then(async (res) => {
        if (res.claimedOrders > 0) {
          toast.success(res.message);
          await load();
        } else {
          toast(res.message);
        }
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setClaiming(false));
  }, [user, load]);

  const confirmCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      const res = await api<{ message: string }>(`/orders/${toCancel.id}/cancel`, { method: "PATCH" });
      toast.success(res.message || "Ordine annullato");
      setToCancel(null);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (!user) return null;

  const claimBox = (
    <section className="flex flex-col gap-4 rounded-3xl bg-sky-soft p-6 sm:flex-row sm:items-center" aria-labelledby="collega-titolo">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sky shadow-sm">
        <Link2 className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="collega-titolo" className="font-extrabold">
          Hai ordinato senza account?
        </h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Collega al profilo gli ordini fatti come ospite con l&apos;email{" "}
          <strong className="break-all text-ink">{user.email}</strong>: ti inviamo un link di conferma e poi
          potrai seguirli e gestirli da qui.
        </p>
      </div>
      <Button variant="dark" loading={claiming} onClick={claim} className="shrink-0">
        {!claiming && <Link2 className="h-4 w-4" aria-hidden />}
        Collega ordini fatti come ospite
      </Button>
    </section>
  );

  if (orders === null) {
    return error ? (
      <div className="space-y-4">
        <FormAlert>{error}</FormAlert>
        <Button variant="outline" loading={refreshing} onClick={() => load(true)}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Riprova
        </Button>
      </div>
    ) : (
      <div className="space-y-4" aria-busy="true" aria-label="Caricamento ordini">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" aria-hidden />}
          title="Non hai ancora ordini"
          text="Quando acquisterai qualcosa, qui troverai stato, tracking e dettagli di ogni ordine."
          action={<LinkButton href="/prodotti">Inizia lo shopping</LinkButton>}
          className="rounded-3xl border border-dashed border-paper-line bg-white"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-ink-muted" aria-live="polite">
              {plural(orders.length, "ordine", "ordini")}
            </p>
            <Button variant="ghost" size="sm" loading={refreshing} onClick={() => load()}>
              {!refreshing && <RefreshCw className="h-4 w-4" aria-hidden />}
              Aggiorna
            </Button>
          </div>
          {error && <FormAlert>{error}</FormAlert>}
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                open={openIds.has(order.id)}
                onToggle={() => toggle(order.id)}
                userId={user.id}
                whatsapp={whatsapp}
                storeAddress={storeAddress}
                onCancel={setToCancel}
                onClaim={claim}
                claiming={claiming}
              />
            ))}
          </div>
        </>
      )}

      {claimBox}

      <p className="flex items-start gap-2 text-sm text-ink-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Hai ricevuto un articolo che non ti convince? Hai {giorniReso} giorni dalla consegna per il{" "}
          <Link href="/recesso" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2">
            recesso online
          </Link>
          . Tutte le informazioni su{" "}
          <Link
            href="/spedizioni-e-resi"
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2"
          >
            spedizioni e resi
          </Link>
          .
        </span>
      </p>

      <Modal open={!!toCancel} onClose={() => !cancelling && setToCancel(null)} title={`Annullare l'ordine #${toCancel?.id ?? ""}?`}>
        <p className="text-[15px] text-ink-soft">
          L&apos;ordine verrà annullato e non sarà spedito. Se hai pagato con carta, Apple Pay o Google Pay, il rimborso
          partirà in automatico e sarà visibile entro 5-10 giorni lavorativi.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setToCancel(null)} disabled={cancelling}>
            No, tienilo
          </Button>
          <Button variant="danger" loading={cancelling} onClick={confirmCancel}>
            Sì, annulla l&apos;ordine
          </Button>
        </div>
      </Modal>
    </div>
  );
}
