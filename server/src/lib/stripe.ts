import Stripe from "stripe";

// Client Stripe condiviso. La chiave mancante non deve far crashare l'API
// (catalogo e carrello funzionano anche senza pagamenti).
// STRIPE_MOCK_URL (solo sviluppo) punta a stripe-mock, es. http://localhost:12111
const mock = process.env.STRIPE_MOCK_URL ? new URL(process.env.STRIPE_MOCK_URL) : null;
export const usingStripeMock = !!mock;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing", {
  apiVersion: "2025-05-28.basil",
  ...(mock
    ? { host: mock.hostname, port: Number(mock.port), protocol: mock.protocol.replace(":", "") as "http" }
    : {}),
});

export default stripe;
