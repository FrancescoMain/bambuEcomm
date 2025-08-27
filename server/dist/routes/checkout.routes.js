"use strict";
// Stripe Checkout Session API route
// Percorso: /api/checkout-session
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const router = express_1.default.Router();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
});
// REMOVE authenticateToken middleware to allow guest checkout
router.post("/checkout-session", (req, res) => {
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
                line_items: cart.map((item) => ({
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
                    cart: JSON.stringify(cart.map((item) => ({
                        ...item,
                        selectedVariants: item.selectedVariants || null // Includi le varianti selezionate
                    }))), // <-- aggiunto per Stripe webhook con varianti
                },
                success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
            });
            res.json({ url: session.url });
        }
        catch (err) {
            console.error("Errore Stripe:", err);
            res
                .status(500)
                .json({ error: "Errore nella creazione della sessione di pagamento." });
        }
    })();
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
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // TODO: implementa la logica per creare/aggiornare l'ordine nel DB
            // Puoi accedere ai dati del cliente tramite session.metadata e session.customer_email
            // Esempio: aggiorna lo stato ordine a "PROCESSING" se già esiste, oppure crea nuovo ordine
            // ...
            console.log("Pagamento completato per sessione:", session.id);
        }
        res.json({ received: true });
    })();
});
exports.default = router;
