// Checkout: creazione dell'ordine e della sessione di pagamento Stripe.
// I prezzi vengono SEMPRE ricalcolati dal server: quelli inviati dal browser sono ignorati.
import express, { Response } from "express";
import Stripe from "stripe";
import { OrderStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import stripe from "../lib/stripe";
import { priceCart, CartLineInput } from "../lib/cartPricing";
import { getSettings } from "../lib/settings";
import { releaseCoupon, reserveCoupon } from "../lib/coupons";
import { frontendUrl } from "../lib/urls";
import { isBot, noStore, rateLimit } from "../lib/http";
import { optionalAuth, AuthRequest } from "../middleware/auth.middleware";
import {
  createOrderFromQuote,
  failPendingOrder,
  sendOrderEmails,
  validateCheckoutForm,
} from "../services/order.service";

const router = express.Router();

const toCents = (eur: number) => Math.round(eur * 100);
/** Importo minimo accettato da Stripe per un pagamento in euro */
const STRIPE_MIN_TOTAL = 0.5;

/** Validazione comune a carta e contrassegno: restituisce preventivo e form, oppure risponde 400. */
const prepareCheckout = async (req: AuthRequest, res: Response) => {
  const body = req.body || {};
  if (isBot(body)) {
    res.status(400).json({ error: "Richiesta non valida." });
    return null;
  }
  const cart: CartLineInput[] = Array.isArray(body.cart) ? body.cart : [];
  if (!cart.length) {
    res.status(400).json({ error: "Il carrello è vuoto." });
    return null;
  }
  const shippingMethod = body.shippingMethod;
  const needsAddress = shippingMethod !== "ritiro";
  const { form, errors } = validateCheckoutForm(body.form, needsAddress);
  if (body.privacy !== true) errors.push("Devi accettare i termini e l'informativa privacy.");
  if (errors.length) {
    res.status(400).json({ error: errors[0], errors });
    return null;
  }

  const quote = await priceCart(cart, {
    couponCode: body.couponCode || null,
    shippingMethod,
    paymentMethod: body.paymentMethod,
    cap: form.cap,
  });
  if (quote.errors.length) {
    res.status(400).json({ error: quote.errors[0], errors: quote.errors, quote });
    return null;
  }
  if (quote.shippingError) {
    res.status(400).json({ error: quote.shippingError, quote });
    return null;
  }
  if (body.couponCode && quote.couponError) {
    res.status(400).json({ error: quote.couponError, quote });
    return null;
  }
  if (quote.itemCount === 0) {
    res.status(400).json({ error: "Il carrello è vuoto." });
    return null;
  }
  return { form, quote };
};

// POST /api/checkout-session — crea l'ordine "in attesa di pagamento" e la sessione Stripe
router.post(
  "/checkout-session",
  noStore,
  rateLimit(20, 10 * 60 * 1000),
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const prepared = await prepareCheckout(req, res);
      if (!prepared) return;
      const { form, quote } = prepared;
      if (quote.paymentMethod !== "stripe") {
        res.status(400).json({ error: "Metodo di pagamento non valido." });
        return;
      }
      if (quote.total < STRIPE_MIN_TOTAL) {
        // es. codice sconto che copre tutto con ritiro in negozio
        res.status(400).json({ error: "L'importo minimo per il pagamento online è di 0,50 €." });
        return;
      }
      // Il codice sconto viene prenotato ora: se nel frattempo ha esaurito gli utilizzi, stop
      if (quote.coupon && !(await reserveCoupon(quote.coupon.promotionId))) {
        res.status(400).json({ error: "Questo codice sconto ha raggiunto il numero massimo di utilizzi." });
        return;
      }

      let order: { id: number };
      try {
        order = await createOrderFromQuote({
          quote,
          form,
          userId: req.user?.userId,
          status: OrderStatus.AWAITING_PAYMENT,
        });
      } catch (error) {
        await releaseCoupon(quote.coupon?.promotionId);
        throw error;
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = quote.items
        .filter((i) => !i.error)
        .map((i) => {
          const details = [i.variantLabel, i.personalizzazione ? `"${i.personalizzazione}"` : ""]
            .filter(Boolean)
            .join(" · ");
          return {
            quantity: i.quantity,
            price_data: {
              currency: "eur",
              unit_amount: toCents(i.prezzoUnitario),
              product_data: {
                name: i.titolo.slice(0, 250),
                ...(details ? { description: details.slice(0, 500) } : {}),
                ...(i.immagine && i.immagine.startsWith("https://") ? { images: [i.immagine] } : {}),
              },
            },
          };
        });

      const shippingName =
        quote.shippingMethod === "ritiro"
          ? "Ritiro in negozio"
          : quote.shippingMethod === "giornata"
            ? "Consegna in giornata"
            : quote.shipping === 0
              ? "Spedizione gratuita"
              : "Spedizione standard";

      let session: Stripe.Checkout.Session;
      try {
        let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
        if (quote.coupon && quote.coupon.discount > 0) {
          // Coupon "usa e getta" con l'importo già calcolato dal server
          const coupon = await stripe.coupons.create({
            amount_off: toCents(quote.coupon.discount),
            currency: "eur",
            duration: "once",
            max_redemptions: 1,
            name: `Codice ${quote.coupon.code}`.slice(0, 40),
            redeem_by: Math.floor(Date.now() / 1000) + 25 * 60 * 60,
          });
          discounts = [{ coupon: coupon.id }];
        }
        session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: "it",
        line_items: lineItems,
        discounts,
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: shippingName,
              fixed_amount: { amount: toCents(quote.shipping), currency: "eur" },
            },
          },
        ],
        customer_email: form.email,
        client_reference_id: String(order.id),
        metadata: { orderId: String(order.id) },
        payment_intent_data: {
          metadata: { orderId: String(order.id) },
          description: `Ordine #${order.id} - Cartoleria Bambù`,
        },
        success_url: `${frontendUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl()}/checkout?annullato=1`,
        });
      } catch (error) {
        // Stripe ha rifiutato coupon o sessione: l'ordine non potrà mai essere pagato
        await failPendingOrder(order.id, OrderStatus.FAILED);
        throw error;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
      res.json({ url: session.url, orderId: order.id });
    } catch (err) {
      console.error("Errore Stripe:", err);
      res.status(500).json({ error: "Errore nella creazione della sessione di pagamento." });
    }
  }
);

// POST /api/checkout/contrassegno — ordine con pagamento alla consegna (se attivo)
router.post(
  "/checkout/contrassegno",
  noStore,
  rateLimit(10, 10 * 60 * 1000),
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const settings = await getSettings();
      if (!settings.pagamenti.contrassegno.attivo) {
        res.status(400).json({ error: "Il pagamento in contrassegno non è disponibile." });
        return;
      }
      req.body = { ...(req.body || {}), paymentMethod: "contrassegno" };
      const prepared = await prepareCheckout(req, res);
      if (!prepared) return;
      const { form, quote } = prepared;
      if (quote.items.some((i) => i.personalizzazione)) {
        res.status(400).json({
          error: "Per i prodotti personalizzati il pagamento alla consegna non è disponibile.",
        });
        return;
      }
      if (quote.coupon && !(await reserveCoupon(quote.coupon.promotionId))) {
        res.status(400).json({ error: "Questo codice sconto ha raggiunto il numero massimo di utilizzi." });
        return;
      }
      let order: { id: number };
      try {
        order = await createOrderFromQuote({
          quote,
          form,
          userId: req.user?.userId,
          status: OrderStatus.PENDING,
        });
      } catch (error) {
        await releaseCoupon(quote.coupon?.promotionId);
        throw error;
      }
      if (req.user?.userId) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: req.user.userId } } });
      }
      await sendOrderEmails(order.id);
      res.status(201).json({ orderId: order.id, total: quote.total });
    } catch (err) {
      console.error("Errore ordine in contrassegno:", err);
      res.status(500).json({ error: "Errore nella creazione dell'ordine." });
    }
  }
);

// GET /api/checkout-session/:sessionId — riepilogo per la pagina "grazie per l'ordine"
router.get("/checkout-session/:sessionId", noStore, async (req, res) => {
  const sessionId = String(req.params.sessionId || "");
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    res.status(400).json({ message: "Sessione non valida" });
    return;
  }
  try {
    const order = await prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        metodoConsegna: true,
        createdAt: true,
        guestEmail: true,
        user: { select: { email: true } },
        orderItems: { select: { titolo: true, quantity: true, priceAtPurchase: true } },
      },
    });
    if (!order) {
      res.status(404).json({ message: "Ordine non trovato" });
      return;
    }
    const email = order.user?.email || order.guestEmail || "";
    res.json({
      orderId: order.id,
      status: order.status,
      paid: ([OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] as OrderStatus[]).includes(order.status),
      total: Number(order.totalAmount),
      metodoConsegna: order.metodoConsegna,
      email: email.replace(/^(.{2}).*(@.*)$/, "$1***$2"),
      items: order.orderItems.map((i) => ({
        titolo: i.titolo,
        quantity: i.quantity,
        prezzo: Number(i.priceAtPurchase),
      })),
    });
  } catch (error) {
    console.error("Errore riepilogo ordine:", error);
    res.status(500).json({ message: "Errore nel recupero dell'ordine" });
  }
});

export default router;
