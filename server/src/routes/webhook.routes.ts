import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Webhook endpoint per Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    (async () => {
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Gestisci solo il pagamento completato
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        // Supporta anche guest: salva email e dati spedizione
        const userId = session.metadata?.userId
          ? Number(session.metadata.userId)
          : null;
        const customerEmail =
          session.customer_email || session.metadata?.email || null;
        const nome = session.metadata?.nome || null;
        const cognome = session.metadata?.cognome || null;
        const telefono = session.metadata?.telefono || null;
        const via = session.metadata?.via || null;
        const numero = session.metadata?.numero || null;
        const citta = session.metadata?.citta || null;
        const cap = session.metadata?.cap || null;
        const stato = session.metadata?.stato || null;
        const note = session.metadata?.note || null;
        // Salva i prodotti acquistati dal carrello serializzato in metadata.cart (se presente)
        type OrderItemCreate = {
          productId: number;
          quantity: number;
          priceAtPurchase: number;
        };
        let orderItemsData: OrderItemCreate[] = [];
        if (session.metadata?.cart) {
          try {
            const cart = JSON.parse(session.metadata.cart);
            if (Array.isArray(cart)) {
              orderItemsData = cart.map((item: any) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
                priceAtPurchase: Number(item.prezzo),
              }));
            }
          } catch (e) {
            console.error("Errore parsing cart da metadata:", e);
          }
        }
        await prisma.order.create({
          data: {
            paymentIntentId: session.payment_intent as string,
            userId: userId || undefined,
            guestEmail: !userId ? customerEmail : undefined,
            status: "PROCESSING",
            totalAmount: session.amount_total
              ? Number(session.amount_total) / 100
              : 0,
            nome,
            cognome,
            telefono,
            via,
            numero,
            citta,
            cap,
            stato,
            note,
            orderItems: orderItemsData.length
              ? { create: orderItemsData }
              : undefined,
          },
        });
      }
      res.json({ received: true });
    })();
  }
);

export default router;
