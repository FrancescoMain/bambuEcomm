"use client";

import { useEffect, useId, useState } from "react";
import { Mail, MapPin, MessageSquareText, Phone, Receipt, Store, UserRound, Zap } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABEL, formatDateTime, formatPrice } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/shop/icons";
import { Callout } from "../Callout";
import { CopyButton } from "../CopyButton";
import { DeliveryBadge, PaymentBadge, StatusBadge } from "./OrderBadges";
import { OrderItems } from "./OrderItems";
import { OrderNextStep } from "./OrderNextStep";
import {
  ALL_STATUSES,
  addressLines,
  customerEmail,
  customerName,
  deliveryOf,
  isCashOnDelivery,
  phoneHref,
  whatsappHref,
} from "./orderUtils";

function Block({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-paper-line bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-muted">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function InvoiceRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-right text-sm font-semibold">
        <span className="truncate">{value}</span>
        <CopyButton text={value} label={`Copia ${label}`} iconOnly className="px-1.5" />
      </dd>
    </div>
  );
}

/** Contenuto del pannello di dettaglio dell'ordine */
export function OrderDetail({
  order,
  typeNames,
  busy,
  onStatus,
  onSaveTracking,
  onManualStatus,
}: {
  order: Order;
  typeNames: Record<string, string>;
  busy: string | null;
  onStatus: (status: OrderStatus, tracking?: string) => void;
  onSaveTracking: (tracking: string) => void;
  onManualStatus: (status: OrderStatus) => void;
}) {
  const statusSelectId = useId();
  const [manualStatus, setManualStatus] = useState<OrderStatus>(order.status);
  useEffect(() => setManualStatus(order.status), [order.id, order.status]);
  const method = deliveryOf(order);
  const email = customerEmail(order);
  const name = customerName(order);
  const address = addressLines(order);
  const subject = `Il tuo ordine #${order.id} - Cartoleria Bambù`;

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">Ricevuto il {formatDateTime(order.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge order={order} />
            <DeliveryBadge order={order} />
            <PaymentBadge order={order} />
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Totale</p>
          <p className="text-2xl font-extrabold tracking-tight">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>

      {order.status === "AWAITING_PAYMENT" && (
        <Callout tone="warning" title="Pagamento non completato">
          Il cliente ha iniziato il checkout ma non ha pagato. Non preparare questo ordine: se il pagamento arriva, lo stato
          diventa automaticamente «In preparazione».
        </Callout>
      )}
      {order.status === "FAILED" && (
        <Callout tone="danger" title="Pagamento non riuscito">
          Il pagamento è stato rifiutato: l&apos;ordine non va preparato.
        </Callout>
      )}
      {isCashOnDelivery(order) && ["PENDING", "PROCESSING", "SHIPPED"].includes(order.status) && (
        <Callout tone="warning" title={`Contrassegno: da incassare ${formatPrice(order.totalAmount)}`}>
          {method === "spedizione"
            ? "Il cliente paga in contanti al corriere: ricordati di indicare l'importo nella spedizione."
            : "Il cliente paga alla consegna."}
        </Callout>
      )}

      <OrderNextStep order={order} busy={busy} onStatus={onStatus} onSaveTracking={onSaveTracking} />

      {order.note && (
        <section className="flex gap-3 rounded-2xl border border-orange/30 bg-orange-soft p-4 text-orange-ink">
          <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Nota del cliente</p>
            <p className="mt-0.5 whitespace-pre-line break-words text-[15px] font-medium text-ink">{order.note}</p>
          </div>
        </section>
      )}

      <OrderItems order={order} typeNames={typeNames} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Block title="Cliente" icon={<UserRound className="h-4 w-4" />}>
          <p className="font-bold">{name}</p>
          <p className="text-sm text-ink-muted">{order.user ? "Cliente registrato" : "Acquisto come ospite"}</p>
          <div className="mt-2 space-y-1 text-sm">
            {email && (
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
                className="flex items-center gap-2 break-all font-semibold text-brand-700 hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" /> {email}
              </a>
            )}
            {order.telefono && (
              <a href={phoneHref(order.telefono)} className="flex items-center gap-2 font-semibold text-brand-700 hover:underline">
                <Phone className="h-4 w-4 shrink-0" /> {order.telefono}
              </a>
            )}
          </div>
          {order.telefono && (
            <a
              href={whatsappHref(order.telefono, `Ciao ${order.nome || ""}, ti scrivo da Cartoleria Bambù per il tuo ordine #${order.id}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("outline", "sm", "mt-3 w-full border-leaf/40 text-leaf-ink hover:bg-leaf-soft")}
            >
              <WhatsAppIcon className="h-4 w-4" /> Scrivi su WhatsApp
            </a>
          )}
        </Block>

        <Block
          title={method === "ritiro" ? "Ritiro" : "Consegna"}
          icon={method === "ritiro" ? <Store className="h-4 w-4" /> : method === "giornata" ? <Zap className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
          action={method !== "ritiro" && address.length > 0 ? <CopyButton text={[name, ...address].join("\n")} label="Copia" /> : undefined}
        >
          {method === "ritiro" ? (
            <>
              <p className="font-bold">Ritiro in negozio</p>
              <p className="text-sm text-ink-muted">Il cliente passa a ritirare l&apos;ordine: avvisalo quando è pronto.</p>
            </>
          ) : address.length ? (
            <>
              {method === "giornata" && <p className="mb-1 text-sm font-bold text-orange-ink">Consegna in giornata</p>}
              <p className="font-bold">{name}</p>
              {address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          ) : (
            <p className="text-sm text-ink-muted">Indirizzo non disponibile per questo ordine.</p>
          )}
        </Block>
      </div>

      {order.richiestaFattura && (
        <Block title="Fattura richiesta" icon={<Receipt className="h-4 w-4" />}>
          <dl className="divide-y divide-paper-line">
            <InvoiceRow label="Ragione sociale" value={order.ragioneSociale} />
            <InvoiceRow label="Partita IVA" value={order.partitaIva} />
            <InvoiceRow label="Codice fiscale" value={order.codiceFiscale} />
            <InvoiceRow label="Codice SDI" value={order.codiceSdi} />
            <InvoiceRow label="PEC" value={order.pec} />
          </dl>
        </Block>
      )}

      <details className="group rounded-2xl border border-paper-line bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink-soft [&::-webkit-details-marker]:hidden">
          Correggi lo stato manualmente
          <span className="text-xs font-normal text-ink-muted group-open:hidden">Solo per sistemare errori</span>
        </summary>
        <div className="border-t border-paper-line p-4">
          <label htmlFor={statusSelectId} className="field-label">
            Nuovo stato
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id={statusSelectId}
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value as OrderStatus)}
              className="field sm:flex-1"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={manualStatus === order.status || !!busy}
              loading={busy === `status:${manualStatus}`}
              onClick={() => onManualStatus(manualStatus)}
            >
              Applica
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Per annullare un ordine e rimborsare il cliente usa il pulsante «Annulla» in fondo: qui il rimborso non viene fatto.
          </p>
        </div>
      </details>
    </div>
  );
}
