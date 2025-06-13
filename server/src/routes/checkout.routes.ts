// Stripe Checkout Session API route
// Percorso: /api/checkout-session

import express from "express";
import Stripe from "stripe";
import { authenticateToken } from "../middleware/auth.middleware";
import { Request } from "express";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Estendi il tipo Request per accedere a req.user
interface UserRequest extends Request {
  user?: any;
}

router.post("/checkout-session", authenticateToken, (req: Request, res) => {
  (async () => {
    try {
      const { form, cart } = req.body;
      // @ts-ignore
      const user = req.user;
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Carrello vuoto." });
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: cart.map((item: any) => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: item.titolo,
            },
            unit_amount: Math.round(item.prezzo * 100),
          },
          quantity: item.quantity,
        })),
        customer_email: user?.email || form.email,
        metadata: {
          userId: user?.userId || "",
          nome: form.nome,
          cognome: form.cognome,
          telefono: form.telefono,
          via: form.via,
          numero: form.numero,
          citta: form.citta,
          cap: form.cap,
          stato: form.stato,
          note: form.note || "",
        },
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Errore Stripe:", err);
      res
        .status(500)
        .json({ error: "Errore nella creazione della sessione di pagamento." });
    }
  })();
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

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        // TODO: implementa la logica per creare/aggiornare l'ordine nel DB
        // Puoi accedere ai dati del cliente tramite session.metadata e session.customer_email
        // Esempio: aggiorna lo stato ordine a "PROCESSING" se già esiste, oppure crea nuovo ordine
        // ...
        console.log("Pagamento completato per sessione:", session.id);
      }
      res.json({ received: true });
    })();
  }
);

export default router;
