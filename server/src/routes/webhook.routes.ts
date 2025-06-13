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
  async (req, res) => {
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
      // Qui puoi aggiornare lo stato ordine nel DB
      try {
        // Esempio: crea ordine nel DB se non esiste già
        await prisma.order.create({
          data: {
            stripeSessionId: session.id,
            userId: session.metadata?.userId || undefined,
            email: session.customer_email!,
            nome: session.metadata?.nome || "",
            cognome: session.metadata?.cognome || "",
            telefono: session.metadata?.telefono || "",
            via: session.metadata?.via || "",
            numero: session.metadata?.numero || "",
            citta: session.metadata?.citta || "",
            cap: session.metadata?.cap || "",
            stato: session.metadata?.stato || "",
            note: session.metadata?.note || "",
            status: "pagato",
          },
        });
      } catch (err) {
        // Se l'ordine esiste già, ignora
        console.error("Errore creazione ordine da webhook:", err);
      }
    }
    res.json({ received: true });
  }
);

export default router;
