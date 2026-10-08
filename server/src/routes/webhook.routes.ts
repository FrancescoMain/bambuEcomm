import express from "express";
import Stripe from "stripe";
import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import stripe from "../lib/stripe";
import { confirmPaidOrder, failPendingOrder, sendOrderEmails } from "../services/order.service";

const router = express.Router();

/**
 * Sessioni create dalla versione precedente del sito (prima del deploy):
 * l'ordine non esiste ancora e il carrello è nei metadata. Lo creiamo qui
 * come faceva il vecchio webhook, una sola volta per sessione/pagamento.
 */
const handleLegacySession = async (session: Stripe.Checkout.Session) => {
  const m = session.metadata || {};
  if (!m.cart || session.payment_status !== "paid") return;
  const paymentIntentId = (session.payment_intent as string) || null;

  const existing = await prisma.order.findFirst({
    where: {
      OR: [{ stripeSessionId: session.id }, ...(paymentIntentId ? [{ paymentIntentId }] : [])],
    },
    select: { id: true },
  });
  if (existing) {
    await sendOrderEmails(existing.id);
    return;
  }

  let items: { productId: number; quantity: number; priceAtPurchase: number; selectedVariants: any }[] = [];
  try {
    const cart = JSON.parse(m.cart);
    if (Array.isArray(cart)) {
      items = cart.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        priceAtPurchase: Number(item.prezzo),
        selectedVariants: item.selectedVariants || null,
      }));
    }
  } catch (e) {
    console.error("Errore parsing cart da metadata:", e);
  }
  const userId = m.userId ? Number(m.userId) : null;
  try {
    const created = await prisma.order.create({
      data: {
        paymentIntentId,
        stripeSessionId: session.id,
        userId: userId || undefined,
        guestEmail: !userId ? session.customer_email || m.email || null : undefined,
        status: OrderStatus.PROCESSING,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        nome: m.nome || null,
        cognome: m.cognome || null,
        telefono: m.telefono || null,
        via: m.via || null,
        numero: m.numero || null,
        citta: m.citta || null,
        cap: m.cap || null,
        stato: m.stato || null,
        note: m.note || null,
        orderItems: items.length
          ? {
              create: items.map((i, idx) => ({
                ...i,
                // il vecchio vincolo era (ordine, prodotto): distinguiamo eventuali duplicati
                variantKey: `legacy-${idx}`,
              })),
            }
          : undefined,
      },
    });
    if (userId) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    }
    if (!(await sendOrderEmails(created.id))) throw new Error("Invio email di conferma non riuscito");
  } catch (error) {
    // Consegna doppia in parallelo: l'altra richiesta ha già creato l'ordine
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
};

/** Solo i metadata identificano l'ordine: client_reference_id può arrivare da link di pagamento esterni */
const orderIdOf = (session: Stripe.Checkout.Session): number | null => {
  const raw = session.metadata?.orderId;
  const id = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(id) ? id : null;
};

const handleSessionPaid = async (session: Stripe.Checkout.Session) => {
  const orderId = orderIdOf(session);
  if (!orderId) {
    await handleLegacySession(session);
    return;
  }
  if (session.payment_status !== "paid") {
    // Pagamento differito (es. bonifico/SEPA): l'ordine resta in attesa con il riferimento
    // al pagamento, così la pulizia notturna non lo annulla; arriverà async_payment_succeeded
    await prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.AWAITING_PAYMENT },
      data: { paymentIntentId: (session.payment_intent as string) || undefined },
    });
    return;
  }
  const result = await confirmPaidOrder(orderId, {
    sessionId: session.id,
    paymentIntentId: (session.payment_intent as string) || null,
    amountTotal: session.amount_total !== null ? session.amount_total / 100 : null,
  });
  if (result === "not-found") {
    console.warn(`Webhook: sessione ${session.id} non corrisponde all'ordine #${orderId}, ignorata`);
    return;
  }
  if (result === "confirmed" || result === "already") {
    // Se l'email di conferma non è partita (es. servizio email giù) facciamo riprovare Stripe
    if (!(await sendOrderEmails(orderId))) throw new Error(`Email di conferma ordine #${orderId} non inviata`);
  }
  console.log(`✅ Ordine #${orderId}: ${result} (sessione ${session.id})`);
};

const handleSessionFailed = async (session: Stripe.Checkout.Session, status: OrderStatus) => {
  const orderId = orderIdOf(session);
  if (!orderId) return;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { stripeSessionId: true } });
  if (!order || (order.stripeSessionId && order.stripeSessionId !== session.id)) return;
  await failPendingOrder(orderId, status);
};

// Webhook Stripe (montato prima di express.json: serve il body raw per la firma)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed.", (err as Error).message);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleSessionPaid(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed":
        await handleSessionFailed(event.data.object as Stripe.Checkout.Session, OrderStatus.FAILED);
        break;
      case "checkout.session.expired":
        await handleSessionFailed(event.data.object as Stripe.Checkout.Session, OrderStatus.CANCELLED);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    // 500 => Stripe riproverà l'invio dell'evento più tardi
    console.error(`Errore gestione webhook ${event.type}:`, error);
    res.status(500).json({ received: false });
  }
});

export default router;
