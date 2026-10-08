import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CartQuote } from "../lib/cartPricing";
import { releaseCoupon } from "../lib/coupons";
import emailService, { OrderData } from "./emailService";

export interface CheckoutForm {
  email: string;
  nome: string;
  cognome: string;
  telefono: string;
  via?: string;
  numero?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  stato?: string;
  note?: string;
  richiestaFattura?: boolean;
  ragioneSociale?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  codiceSdi?: string;
  pec?: string;
}

const clean = (v: unknown, max = 200): string | undefined => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : undefined;
};

/** Valida i dati del checkout. Restituisce il form normalizzato o l'elenco errori. */
export const validateCheckoutForm = (
  raw: any,
  needsAddress: boolean
): { form: CheckoutForm; errors: string[] } => {
  const errors: string[] = [];
  const form: CheckoutForm = {
    email: (clean(raw?.email, 254) || "").toLowerCase(),
    nome: clean(raw?.nome, 80) || "",
    cognome: clean(raw?.cognome, 80) || "",
    telefono: clean(raw?.telefono, 30) || "",
    via: clean(raw?.via, 160),
    numero: clean(raw?.numero, 20),
    citta: clean(raw?.citta, 80),
    cap: clean(raw?.cap, 10),
    provincia: clean(raw?.provincia, 4)?.toUpperCase(),
    stato: clean(raw?.stato, 60) || "Italia",
    note: clean(raw?.note, 1000),
    richiestaFattura: !!raw?.richiestaFattura,
    ragioneSociale: clean(raw?.ragioneSociale, 160),
    partitaIva: clean(raw?.partitaIva, 20)?.replace(/\s/g, ""),
    codiceFiscale: clean(raw?.codiceFiscale, 20)?.replace(/\s/g, "").toUpperCase(),
    codiceSdi: clean(raw?.codiceSdi, 10)?.toUpperCase(),
    pec: clean(raw?.pec, 254),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errors.push("Inserisci un'email valida.");
  if (!form.nome) errors.push("Inserisci il nome.");
  if (!form.cognome) errors.push("Inserisci il cognome.");
  if (!form.telefono || form.telefono.replace(/\D/g, "").length < 6) {
    errors.push("Inserisci un numero di telefono valido.");
  }
  if (needsAddress) {
    if (!form.via) errors.push("Inserisci l'indirizzo.");
    if (!form.numero) errors.push("Inserisci il numero civico.");
    if (!form.citta) errors.push("Inserisci la città.");
    if (!form.cap || !/^\d{5}$/.test(form.cap)) errors.push("Il CAP deve essere di 5 cifre.");
  }
  if (form.richiestaFattura) {
    if (!form.codiceFiscale && !form.partitaIva) {
      errors.push("Per la fattura indica il codice fiscale o la partita IVA.");
    }
    if (form.partitaIva && !/^\d{11}$/.test(form.partitaIva)) {
      errors.push("La partita IVA deve essere di 11 cifre.");
    }
    if (form.codiceFiscale && !/^([A-Z0-9]{16}|\d{11})$/.test(form.codiceFiscale)) {
      errors.push("Codice fiscale non valido.");
    }
  }
  return { form, errors };
};

/** Crea l'ordine (in attesa di pagamento) a partire dal preventivo calcolato dal server. */
export const createOrderFromQuote = async (params: {
  quote: CartQuote;
  form: CheckoutForm;
  userId?: number | null;
  status: OrderStatus;
}) => {
  const { quote, form, userId, status } = params;
  const valid = quote.items.filter((i) => !i.error);
  const lines = quote.omaggio ? [...valid, quote.omaggio] : valid;

  return prisma.order.create({
    data: {
      userId: userId || undefined,
      guestEmail: userId ? undefined : form.email,
      status,
      totalAmount: quote.total,
      subtotale: quote.subtotal,
      costoSpedizione: quote.shipping,
      sconto: quote.coupon?.discount ?? null,
      codiceCoupon: quote.coupon?.code ?? null,
      promotionId: quote.coupon?.promotionId ?? null,
      metodoConsegna: quote.shippingMethod,
      metodoPagamento: quote.paymentMethod,
      commissionePagamento: quote.paymentFee || null,
      nome: form.nome,
      cognome: form.cognome,
      telefono: form.telefono,
      via: quote.shippingMethod === "ritiro" ? null : form.via,
      numero: quote.shippingMethod === "ritiro" ? null : form.numero,
      citta: quote.shippingMethod === "ritiro" ? null : form.citta,
      cap: quote.shippingMethod === "ritiro" ? null : form.cap,
      stato: quote.shippingMethod === "ritiro" ? null : [form.provincia, form.stato].filter(Boolean).join(" - "),
      note: form.note,
      richiestaFattura: !!form.richiestaFattura,
      ragioneSociale: form.richiestaFattura ? form.ragioneSociale : null,
      partitaIva: form.richiestaFattura ? form.partitaIva : null,
      codiceFiscale: form.richiestaFattura ? form.codiceFiscale : null,
      codiceSdi: form.richiestaFattura ? form.codiceSdi : null,
      pec: form.richiestaFattura ? form.pec : null,
      orderItems: {
        create: lines.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceAtPurchase: i.prezzoUnitario,
          prezzoListino: i.prezzoListino,
          titolo: i.omaggio ? `${i.titolo} (omaggio)` : i.titolo,
          selectedVariants: (i.selectedVariants as Prisma.InputJsonValue) ?? Prisma.DbNull,
          variantKey: i.variantKey,
          personalizzazione: i.personalizzazione,
        })),
      },
    },
    select: { id: true },
  });
};

const orderEmailInclude = {
  orderItems: { include: { product: { select: { titolo: true } } } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

type OrderForEmail = Prisma.OrderGetPayload<{ include: typeof orderEmailInclude }>;

const variantText = (selected: unknown, personalizzazione?: string | null): string => {
  const parts: string[] = [];
  if (selected && typeof selected === "object") {
    Object.values(selected as Record<string, { nome?: string }>).forEach((v) => v?.nome && parts.push(v.nome));
  }
  if (personalizzazione) parts.push(`Personalizzazione: "${personalizzazione}"`);
  return parts.join(" · ");
};

export const buildOrderEmailData = (order: OrderForEmail): OrderData => ({
  orderId: order.id.toString(),
  customerName:
    `${order.nome || ""} ${order.cognome || ""}`.trim() || order.user?.name || "Cliente",
  customerEmail: order.user?.email || order.guestEmail || "",
  items: order.orderItems.map((item) => ({
    name: item.titolo || item.product.titolo,
    quantity: item.quantity,
    price: Number(item.priceAtPurchase),
    originalPrice: item.prezzoListino ? Number(item.prezzoListino) : undefined,
    details: variantText(item.selectedVariants, item.personalizzazione),
  })),
  subtotal: order.subtotale !== null ? Number(order.subtotale) : undefined,
  shippingCost: order.costoSpedizione !== null ? Number(order.costoSpedizione) : undefined,
  discount: order.sconto !== null ? Number(order.sconto) : undefined,
  couponCode: order.codiceCoupon || undefined,
  paymentFee: order.commissionePagamento !== null ? Number(order.commissionePagamento) : undefined,
  paymentMethod: order.metodoPagamento || "stripe",
  deliveryMethod: order.metodoConsegna || "spedizione",
  total: Number(order.totalAmount),
  orderDate: order.createdAt.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }),
  phone: order.telefono || undefined,
  notes: order.note || undefined,
  invoice: order.richiestaFattura
    ? {
        ragioneSociale: order.ragioneSociale,
        partitaIva: order.partitaIva,
        codiceFiscale: order.codiceFiscale,
        codiceSdi: order.codiceSdi,
        pec: order.pec,
      }
    : undefined,
  shippingAddress:
    order.metodoConsegna === "ritiro"
      ? undefined
      : {
          nome: order.nome,
          cognome: order.cognome,
          via: order.via,
          numero: order.numero,
          citta: order.citta,
          cap: order.cap,
          stato: order.stato,
        },
});

/**
 * Email di conferma al cliente e notifica al negozio.
 * Restituisce false solo se l'invio al cliente è fallito con il servizio email configurato
 * (così il webhook può chiedere a Stripe di riprovare più tardi).
 */
export const sendOrderEmails = async (orderId: number): Promise<boolean> => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderEmailInclude });
  if (!order || order.emailInviataAt) return true;
  const data = buildOrderEmailData(order);
  const customerOk = data.customerEmail ? await emailService.sendOrderConfirmationEmail(data) : true;
  if (customerOk && emailService.isConfigured()) {
    await prisma.order.update({ where: { id: orderId }, data: { emailInviataAt: new Date() } });
    await emailService.sendOrderNotificationToAdmin(data);
  }
  return customerOk || !emailService.isConfigured();
};

/** Annulla un ordine rimasto in attesa di pagamento e libera il codice sconto prenotato. */
export const failPendingOrder = async (orderId: number, status: OrderStatus): Promise<boolean> => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { promotionId: true } });
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: OrderStatus.AWAITING_PAYMENT },
    data: { status },
  });
  if (updated.count > 0) await releaseCoupon(order?.promotionId);
  return updated.count > 0;
};

export type ConfirmResult = "confirmed" | "already" | "not-found" | "cancelled";

/**
 * Conferma un ordine pagato con Stripe. È idempotente e legata alla sessione:
 * solo la sessione creata per quell'ordine può confermarlo. Stato e svuotamento
 * del carrello avvengono nella stessa transazione.
 */
export const confirmPaidOrder = async (
  orderId: number,
  payment: { sessionId: string; paymentIntentId?: string | null; amountTotal?: number | null }
): Promise<ConfirmResult> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true, stripeSessionId: true, totalAmount: true },
  });
  // La sessione deve essere quella creata per l'ordine (o non ancora registrata,
  // se il salvataggio dell'id dopo la creazione della sessione non è riuscito)
  if (!order || (order.stripeSessionId && order.stripeSessionId !== payment.sessionId)) return "not-found";

  if (order.status !== OrderStatus.AWAITING_PAYMENT) {
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED) {
      // Pagamento arrivato per un ordine già annullato: serve un controllo manuale
      await emailService.sendAdminAlert(
        `Pagamento ricevuto per l'ordine annullato #${orderId}`,
        `Stripe ha confermato il pagamento della sessione ${payment.sessionId} (payment intent ${payment.paymentIntentId || "-"}) per l'ordine #${orderId}, che risulta ${order.status}. Verifica l'ordine e, se necessario, riattivalo o rimborsa il cliente dalla dashboard di Stripe.`
      );
      return "cancelled";
    }
    return "already";
  }

  const expected = Math.round(Number(order.totalAmount) * 100);
  const paidCents =
    payment.amountTotal !== null && payment.amountTotal !== undefined ? Math.round(payment.amountTotal * 100) : expected;
  if (paidCents !== expected) {
    await emailService.sendAdminAlert(
      `Importo pagato diverso dal totale dell'ordine #${orderId}`,
      `L'ordine #${orderId} ha un totale di ${(expected / 100).toFixed(2)} € ma Stripe ha incassato ${(paidCents / 100).toFixed(2)} € (sessione ${payment.sessionId}). Controlla prima di spedire.`
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.AWAITING_PAYMENT,
        OR: [{ stripeSessionId: payment.sessionId }, { stripeSessionId: null }],
      },
      data: {
        status: OrderStatus.PROCESSING,
        stripeSessionId: payment.sessionId,
        paymentIntentId: payment.paymentIntentId || undefined,
      },
    });
    if (res.count > 0 && order.userId) {
      await tx.cartItem.deleteMany({ where: { cart: { userId: order.userId } } });
    }
    return res.count;
  });
  return updated > 0 ? "confirmed" : "already";
};
