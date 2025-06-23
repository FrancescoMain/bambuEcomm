import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import emailService from "../services/emailService";

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
          }        }
        
        const createdOrder = await prisma.order.create({
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
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // 🔥 INVIO EMAIL ORDINE CONFERMATO
        console.log("🔧 DEBUG: Webhook - Iniziando processo invio email per ordine:", createdOrder.id);
        try {
          // Determina email e nome cliente (utente registrato o guest)
          const customerEmailFinal = createdOrder.user?.email || createdOrder.guestEmail || customerEmail;
          const customerNameFinal = createdOrder.user?.name || `${nome || ''} ${cognome || ''}`.trim() || "Cliente";

          if (customerEmailFinal) {
            // Prepara i dati per l'email
            const orderData = {
              orderId: createdOrder.id.toString(),
              customerName: customerNameFinal,
              customerEmail: customerEmailFinal,
              items: createdOrder.orderItems.map((item) => ({
                name: item.product.titolo,
                quantity: item.quantity,
                price: Number(item.priceAtPurchase),
              })),
              total: Number(createdOrder.totalAmount),
              orderDate: createdOrder.createdAt.toLocaleDateString("it-IT"),
              shippingAddress: {
                nome,
                cognome,
                via,
                numero,
                citta,
                cap,
                stato,
              },
            };

            console.log("🔧 DEBUG: Webhook - Dati ordine preparati:", orderData);

            // Email al cliente
            console.log(`📧 Webhook - Tentativo invio email conferma ordine a: ${orderData.customerEmail}`);
            const customerEmailSent = await emailService.sendOrderConfirmationEmail(orderData);

            if (customerEmailSent) {
              console.log(`✅ Webhook - Email conferma ordine inviata al cliente: ${orderData.customerEmail}`);
            } else {
              console.log(`⚠️ Webhook - Fallimento invio email conferma ordine al cliente: ${orderData.customerEmail}`);
            }

            // Email all'admin
            console.log(`📧 Webhook - Tentativo invio notifica ordine all'admin`);
            const adminEmailSent = await emailService.sendOrderNotificationToAdmin(orderData);

            if (adminEmailSent) {
              console.log(`✅ Webhook - Email notifica ordine inviata all'admin`);
            } else {
              console.log(`⚠️ Webhook - Fallimento invio email notifica ordine all'admin`);
            }
          } else {
            console.error("❌ Webhook - Nessuna email trovata per l'ordine:", createdOrder.id);
          }
        } catch (emailError) {
          console.error("❌ Webhook - Errore durante invio email ordine:", emailError);
          // Non blocchiamo il webhook se le email falliscono
        }
      }
      res.json({ received: true });
    })();
  }
);

// TEST: rispondi sempre 200 per debug routing
router.post("/webhook-test", (req, res) => {
  console.log("/api/webhook-test hit", new Date().toISOString());
  res.status(200).json({ message: "Webhook test OK" });
});

export default router;
