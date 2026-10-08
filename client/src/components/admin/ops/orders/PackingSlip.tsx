import type { Order, StoreSettings } from "@/lib/types";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  DELIVERY_LABEL,
  addressLines,
  customerEmail,
  customerName,
  deliveryOf,
  isCashOnDelivery,
  itemCount,
  itemTitle,
  variantLabels,
} from "./orderUtils";

/**
 * Distinta di preparazione stampabile: visibile solo in stampa
 * (window.print()), senza menu, pulsanti né colori.
 */
export function PackingSlip({
  order,
  settings,
  typeNames,
}: {
  order: Order;
  settings: StoreSettings | null;
  typeNames: Record<string, string>;
}) {
  const method = deliveryOf(order);
  const shopName = settings?.azienda.ragioneSociale || "Cartoleria Bambù";
  const address = addressLines(order);
  const cod = isCashOnDelivery(order);

  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block" aria-hidden>
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <div>
          <p className="text-[18pt] font-extrabold">{shopName}</p>
          {settings && (
            <p className="mt-1 text-[10pt]">
              {settings.contatti.indirizzo} · {settings.contatti.citta}
              <br />
              Tel. {settings.contatti.telefono} · {settings.contatti.email}
              {settings.azienda.partitaIva && (
                <>
                  <br />
                  P.IVA {settings.azienda.partitaIva}
                </>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[18pt] font-extrabold">Ordine #{order.id}</p>
          <p className="text-[10pt]">del {formatDateTime(order.createdAt)}</p>
          <p className="mt-1 inline-block border border-black px-2 py-0.5 text-[10pt] font-bold uppercase">
            {DELIVERY_LABEL[method]}
          </p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[9pt] font-bold uppercase tracking-wider">{method === "ritiro" ? "Cliente" : "Destinatario"}</p>
          <p className="mt-1 text-[13pt] font-bold">{customerName(order)}</p>
          {method === "ritiro" ? <p>Ritiro in negozio</p> : address.map((line) => <p key={line}>{line}</p>)}
          {order.telefono && <p className="mt-1">Tel. {order.telefono}</p>}
          {customerEmail(order) && <p>{customerEmail(order)}</p>}
        </div>
        <div>
          <p className="text-[9pt] font-bold uppercase tracking-wider">Pagamento</p>
          {cod ? (
            <p className="mt-1 border-2 border-black p-2 text-[13pt] font-extrabold">
              CONTRASSEGNO: incassare {formatPrice(order.totalAmount)}
            </p>
          ) : (
            <p className="mt-1">Pagato online · Totale {formatPrice(order.totalAmount)}</p>
          )}
          {order.trackingNumber && (
            <p className="mt-2">
              Tracking: <span className="font-mono font-bold">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      </section>

      {order.note && (
        <section className="mt-4 border border-black p-3">
          <p className="text-[9pt] font-bold uppercase tracking-wider">Nota del cliente</p>
          <p className="mt-1 whitespace-pre-line">{order.note}</p>
        </section>
      )}

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-black text-[9pt] uppercase tracking-wider">
            <th className="w-8 py-2" aria-label="Preparato" />
            <th className="py-2">Articolo</th>
            <th className="w-16 py-2 text-right">Q.tà</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item) => {
            const variants = variantLabels(item, typeNames);
            return (
              <tr key={item.id} className="break-inside-avoid border-b border-gray-400 align-top">
                <td className="py-2.5">
                  <span className="inline-block h-4 w-4 border-2 border-black" />
                </td>
                <td className="py-2.5 pr-3">
                  <p className="font-semibold">{itemTitle(item)}</p>
                  {variants.length > 0 && <p className="text-[10pt]">{variants.join(" · ")}</p>}
                  {item.personalizzazione && (
                    <p className="text-[10pt] font-bold">Personalizzazione: «{item.personalizzazione}»</p>
                  )}
                </td>
                <td className="py-2.5 text-right text-[13pt] font-extrabold">{item.quantity}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td className="pt-2 text-right font-semibold">Totale pezzi</td>
            <td className="pt-2 text-right text-[13pt] font-extrabold">{itemCount(order)}</td>
          </tr>
        </tfoot>
      </table>

      {order.richiestaFattura && (
        <section className="mt-5 border border-black p-3 text-[10pt]">
          <p className="text-[9pt] font-bold uppercase tracking-wider">Fattura richiesta</p>
          <p className="mt-1">
            {[
              order.ragioneSociale,
              order.partitaIva && `P.IVA ${order.partitaIva}`,
              order.codiceFiscale && `C.F. ${order.codiceFiscale}`,
              order.codiceSdi && `SDI ${order.codiceSdi}`,
              order.pec && `PEC ${order.pec}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </section>
      )}

      <p className="mt-8 text-center text-[10pt]">Grazie per aver scelto {shopName}!</p>
    </div>
  );
}
