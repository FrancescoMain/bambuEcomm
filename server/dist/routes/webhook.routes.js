"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const emailService_1 = __importDefault(require("../services/emailService"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
});
// Webhook endpoint per Stripe
router.post("/webhook", express_1.default.raw({ type: "application/json" }), (req, res) => {
    (async () => {
        const sig = req.headers["stripe-signature"];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            console.error("Webhook signature verification failed.", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        // Gestisci solo il pagamento completato
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // Supporta anche guest: salva email e dati spedizione
            const userId = session.metadata?.userId
                ? Number(session.metadata.userId)
                : null;
            const customerEmail = session.customer_email || session.metadata?.email || null;
            const nome = session.metadata?.nome || null;
            const cognome = session.metadata?.cognome || null;
            const telefono = session.metadata?.telefono || null;
            const via = session.metadata?.via || null;
            const numero = session.metadata?.numero || null;
            const citta = session.metadata?.citta || null;
            const cap = session.metadata?.cap || null;
            const stato = session.metadata?.stato || null;
            const note = session.metadata?.note || null;
            let orderItemsData = [];
            if (session.metadata?.cart) {
                try {
                    const cart = JSON.parse(session.metadata.cart);
                    if (Array.isArray(cart)) {
                        orderItemsData = cart.map((item) => ({
                            productId: Number(item.productId),
                            quantity: Number(item.quantity),
                            priceAtPurchase: Number(item.prezzo),
                        }));
                    }
                }
                catch (e) {
                    console.error("Errore parsing cart da metadata:", e);
                }
            }
            console.log(`🔧 DEBUG: Dati ordine per creazione:`, {
                userId: userId || "GUEST",
                customerEmail,
                guestEmail: !userId ? customerEmail : undefined,
                sessionId: session.id,
                paymentIntent: session.payment_intent,
            });
            const createdOrder = await prisma.order.create({
                data: {
                    paymentIntentId: session.payment_intent,
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
            console.log(`✅ Ordine creato via webhook:`, {
                orderId: createdOrder.id,
                userId: createdOrder.userId || "GUEST",
                guestEmail: createdOrder.guestEmail,
                customerEmail: createdOrder.user?.email,
                total: createdOrder.totalAmount,
                status: createdOrder.status,
            });
            // 🛒 SVUOTA IL CARRELLO DOPO ORDINE COMPLETATO
            console.log("🛒 Webhook - Svuotamento carrello per ordine:", createdOrder.id);
            try {
                if (userId) {
                    // Per utenti registrati: svuota il carrello nel database
                    // Prima trova il cart dell'utente
                    const userCart = await prisma.cart.findUnique({
                        where: { userId: userId },
                    });
                    if (userCart) {
                        // Elimina tutti i CartItem del cart
                        await prisma.cartItem.deleteMany({
                            where: { cartId: userCart.id },
                        });
                        console.log(`✅ Webhook - Carrello DB svuotato per utente ${userId} (cart ID: ${userCart.id})`);
                    }
                    else {
                        console.log(`ℹ️ Webhook - Nessun carrello trovato per utente ${userId}`);
                    }
                }
                else {
                    // Per guest: il carrello frontend si occuperà di svuotarsi
                    // tramite localStorage quando riceve la conferma di pagamento
                    console.log("ℹ️ Webhook - Ordine guest: carrello frontend gestito via localStorage");
                }
            }
            catch (cartError) {
                console.error("❌ Webhook - Errore durante svuotamento carrello:", cartError);
                // Non blocchiamo il webhook se lo svuotamento carrello fallisce
            }
            // 🔥 INVIO EMAIL ORDINE CONFERMATO
            console.log("🔧 DEBUG: Webhook - Iniziando processo invio email per ordine:", createdOrder.id);
            try {
                // Determina email e nome cliente (utente registrato o guest)
                const customerEmailFinal = createdOrder.user?.email ||
                    createdOrder.guestEmail ||
                    customerEmail;
                const customerNameFinal = createdOrder.user?.name ||
                    `${nome || ""} ${cognome || ""}`.trim() ||
                    "Cliente";
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
                    const customerEmailSent = await emailService_1.default.sendOrderConfirmationEmail(orderData);
                    if (customerEmailSent) {
                        console.log(`✅ Webhook - Email conferma ordine inviata al cliente: ${orderData.customerEmail}`);
                    }
                    else {
                        console.log(`⚠️ Webhook - Fallimento invio email conferma ordine al cliente: ${orderData.customerEmail}`);
                    }
                    // Email all'admin
                    console.log(`📧 Webhook - Tentativo invio notifica ordine all'admin`);
                    const adminEmailSent = await emailService_1.default.sendOrderNotificationToAdmin(orderData);
                    if (adminEmailSent) {
                        console.log(`✅ Webhook - Email notifica ordine inviata all'admin`);
                    }
                    else {
                        console.log(`⚠️ Webhook - Fallimento invio email notifica ordine all'admin`);
                    }
                }
                else {
                    console.error("❌ Webhook - Nessuna email trovata per l'ordine:", createdOrder.id);
                }
            }
            catch (emailError) {
                console.error("❌ Webhook - Errore durante invio email ordine:", emailError);
                // Non blocchiamo il webhook se le email falliscono
            }
        }
        res.json({ received: true });
    })();
});
// TEST: rispondi sempre 200 per debug routing
router.post("/webhook-test", (req, res) => {
    console.log("/api/webhook-test hit", new Date().toISOString());
    res.status(200).json({ message: "Webhook test OK" });
});
exports.default = router;
