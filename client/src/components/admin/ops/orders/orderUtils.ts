import type { Order, OrderItem, OrderStatus, ShippingMethod } from "@/lib/types";
import { ORDER_STATUS_LABEL, toNumber } from "@/lib/format";
import { whatsappUrl } from "@/lib/urls";

export type OrdersResponse = {
  data: Order[];
  totalPages: number;
  currentPage: number;
  totalOrders: number;
  countsByStatus: Partial<Record<OrderStatus, number>>;
};

export type StatusCounts = Partial<Record<OrderStatus, number>>;

// ---------------------------------------------------------------- schede

export type OrderTabKey = "da-preparare" | "spediti" | "consegnati" | "annullati" | "tutti";

export const ORDER_TABS: {
  key: OrderTabKey;
  label: string;
  /** "all" = tutti gli stati, compresi i checkout abbandonati */
  statuses: OrderStatus[] | "all";
  highlight?: boolean;
  empty: { title: string; text: string };
}[] = [
  {
    key: "da-preparare",
    label: "Da preparare",
    statuses: ["PROCESSING", "PENDING"],
    highlight: true,
    empty: { title: "Nessun ordine da preparare", text: "Quando arriva un nuovo ordine lo trovi qui." },
  },
  {
    key: "spediti",
    label: "Spediti",
    statuses: ["SHIPPED"],
    empty: { title: "Nessun ordine in viaggio", text: "Qui trovi gli ordini spediti o pronti per il ritiro in negozio." },
  },
  {
    key: "consegnati",
    label: "Consegnati",
    statuses: ["DELIVERED"],
    empty: { title: "Nessun ordine consegnato", text: "Gli ordini consegnati o ritirati compaiono qui." },
  },
  {
    key: "annullati",
    label: "Annullati e rimborsati",
    statuses: ["CANCELLED", "REFUNDED", "FAILED"],
    empty: { title: "Nessun ordine annullato", text: "Ottimo! Nessun ordine annullato o rimborsato." },
  },
  {
    key: "tutti",
    label: "Tutti",
    statuses: "all",
    empty: { title: "Nessun ordine", text: "Non ci sono ancora ordini." },
  },
];

export const tabCount = (tab: (typeof ORDER_TABS)[number], counts: StatusCounts | null | undefined): number | null => {
  if (!counts) return null;
  const list = tab.statuses === "all" ? (Object.keys(counts) as OrderStatus[]) : tab.statuses;
  return list.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
};

// ---------------------------------------------------------------- cliente

export const deliveryOf = (o: Pick<Order, "metodoConsegna">): ShippingMethod =>
  o.metodoConsegna === "ritiro" || o.metodoConsegna === "giornata" ? o.metodoConsegna : "spedizione";

export const isCashOnDelivery = (o: Pick<Order, "metodoPagamento">) => o.metodoPagamento === "contrassegno";

export const customerName = (o: Order) =>
  `${o.nome ?? ""} ${o.cognome ?? ""}`.trim() || o.user?.name || "Cliente";

export const customerEmail = (o: Order) => o.user?.email || o.guestEmail || "";

export const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Link WhatsApp: aggiunge il prefisso italiano se manca */
export const whatsappHref = (phone: string, text?: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!(digits.startsWith("39") && digits.length >= 11)) digits = `39${digits}`;
  return whatsappUrl(digits, text);
};

export const addressLines = (o: Order): string[] =>
  [[o.via, o.numero].filter(Boolean).join(", "), [o.cap, o.citta].filter(Boolean).join(" "), o.stato ?? ""].filter(
    (line) => line.trim()
  );

// ---------------------------------------------------------------- articoli

export const itemTitle = (i: OrderItem) => i.titolo || i.product?.titolo || "Prodotto";

export const itemCount = (o: Order) => o.orderItems.reduce((n, i) => n + i.quantity, 0);

/** "Colore: Rosso" (se conosciamo il nome della variante) oppure solo "Rosso" */
export const variantLabels = (item: OrderItem, typeNames?: Record<string, string>): string[] => {
  const selected = item.selectedVariants;
  if (!selected || typeof selected !== "object") return [];
  return Object.entries(selected)
    .map(([typeId, value]) => {
      const name = typeNames?.[typeId];
      const label = String(value?.nome ?? "").trim();
      if (!label) return "";
      return name ? `${name}: ${label}` : label;
    })
    .filter(Boolean);
};

export const orderTotals = (o: Order) => {
  const itemsTotal = o.orderItems.reduce((sum, i) => sum + toNumber(i.priceAtPurchase) * i.quantity, 0);
  return {
    subtotal: o.subtotale !== null && o.subtotale !== undefined ? toNumber(o.subtotale) : itemsTotal,
    discount: toNumber(o.sconto),
    shipping: o.costoSpedizione !== null && o.costoSpedizione !== undefined ? toNumber(o.costoSpedizione) : null,
    fee: toNumber(o.commissionePagamento),
    total: toNumber(o.totalAmount),
  };
};

// ---------------------------------------------------------------- stati

export const DELIVERY_LABEL: Record<ShippingMethod, string> = {
  spedizione: "Spedizione",
  ritiro: "Ritiro in negozio",
  giornata: "In giornata",
};

/** Etichetta dello stato che tiene conto del metodo di consegna */
export const statusLabel = (o: Pick<Order, "status" | "metodoConsegna">): string => {
  const method = deliveryOf(o);
  if (o.status === "SHIPPED" && method === "ritiro") return "Pronto per il ritiro";
  if (o.status === "SHIPPED" && method === "giornata") return "In consegna";
  if (o.status === "DELIVERED" && method === "ritiro") return "Ritirato";
  return ORDER_STATUS_LABEL[o.status] ?? o.status;
};

export type StatusAction = {
  status: OrderStatus;
  label: string;
  hint: string;
  primary: boolean;
};

/** Le azioni "naturali" per far avanzare l'ordine */
export const nextActions = (o: Order): StatusAction[] => {
  const method = deliveryOf(o);
  switch (o.status) {
    case "PENDING":
    case "PROCESSING":
      if (method === "ritiro") {
        return [
          {
            status: "SHIPPED",
            label: "Pronto per il ritiro",
            hint: "Il cliente riceve un'email: l'ordine lo aspetta in negozio.",
            primary: true,
          },
          { status: "DELIVERED", label: "Già ritirato", hint: "Nessuna email al cliente.", primary: false },
        ];
      }
      if (method === "giornata") {
        return [
          {
            status: "SHIPPED",
            label: "In consegna",
            hint: "Il cliente riceve un'email: l'ordine è in arrivo.",
            primary: true,
          },
          { status: "DELIVERED", label: "Già consegnato", hint: "Nessuna email al cliente.", primary: false },
        ];
      }
      return [
        {
          status: "SHIPPED",
          label: "Segna come spedito",
          hint: "Il cliente riceve un'email con il numero di tracking (se lo inserisci).",
          primary: true,
        },
      ];
    case "SHIPPED":
      return [
        {
          status: "DELIVERED",
          label: method === "ritiro" ? "Ritirato dal cliente" : "Segna come consegnato",
          hint: "Nessuna email al cliente.",
          primary: true,
        },
      ];
    default:
      return [];
  }
};

/** Si può annullare (con rimborso automatico se pagato online) */
export const canCancel = (o: Order) => ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status);

export const isPaidOnline = (o: Order) => !isCashOnDelivery(o) && !!o.paymentIntentId;

/** Testo di conferma per il cambio di stato manuale */
export const statusChangeWarning = (o: Order, status: OrderStatus): string => {
  switch (status) {
    case "SHIPPED":
      return deliveryOf(o) === "ritiro"
        ? "Il cliente riceverà l'email «ordine pronto per il ritiro»."
        : "Il cliente riceverà l'email di spedizione (con il tracking, se presente).";
    case "CANCELLED":
      return "Il cliente riceverà l'email di annullamento. Attenzione: così NON viene fatto alcun rimborso. Per rimborsare usa «Annulla e rimborsa».";
    case "REFUNDED":
      return "Nessun rimborso viene eseguito da qui: usa questo stato solo se hai già rimborsato il cliente (ad esempio dalla dashboard di Stripe). Nessuna email al cliente.";
    default:
      return "Nessuna email verrà inviata al cliente.";
  }
};

export const statusSuccessMessage = (o: Order, status: OrderStatus): string => {
  const method = deliveryOf(o);
  if (status === "SHIPPED") {
    if (method === "ritiro") return `Ordine #${o.id} pronto per il ritiro: il cliente è stato avvisato via email.`;
    if (method === "giornata") return `Ordine #${o.id} in consegna: il cliente è stato avvisato via email.`;
    return `Ordine #${o.id} spedito: il cliente è stato avvisato via email.`;
  }
  if (status === "DELIVERED") return `Ordine #${o.id} segnato come ${method === "ritiro" ? "ritirato" : "consegnato"}.`;
  if (status === "CANCELLED") return `Ordine #${o.id} annullato.`;
  return `Stato dell'ordine #${o.id} aggiornato.`;
};

export const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
  "AWAITING_PAYMENT",
];
