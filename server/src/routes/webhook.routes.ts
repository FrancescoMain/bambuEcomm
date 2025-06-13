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
        const userId = session.metadata?.userId ? Number(session.metadata.userId) : null;
        if (!userId) {
          console.error("userId mancante: impossibile creare ordine");
          return res.status(400).send("userId mancante");
        }
        try {
          await prisma.order.create({
            data: {
              paymentIntentId: session.payment_intent as string,
              userId,
              status: "PROCESSING",
              totalAmount: session.amount_total ? Number(session.amount_total) / 100 : 0,
            },
          });
        } catch (err) {
          // Se l'ordine esiste già, ignora
          console.error("Errore creazione ordine da webhook:", err);
        }
      }
      res.json({ received: true });
    })();
  }
);

export default router;
