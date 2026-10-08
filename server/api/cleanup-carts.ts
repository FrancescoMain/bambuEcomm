import { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "../src/lib/prisma";
import { failPendingOrder } from "../src/services/order.service";

/**
 * Cron Vercel (ogni notte alle 3): svuota le righe di carrello non toccate da 48 ore
 * e annulla i checkout abbandonati (mai completati su Stripe) da più di 2 giorni.
 * Gli ordini con un pagamento differito in corso (bonifico/SEPA) hanno già il
 * paymentIntentId e NON vengono toccati.
 * Vercel invoca i cron con GET e, se CRON_SECRET è impostata, con
 * "Authorization: Bearer <CRON_SECRET>".
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [items, carts] = await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { updatedAt: { lt: cutoff } } }),
      prisma.cart.deleteMany({ where: { items: { none: {} }, updatedAt: { lt: cutoff } } }),
    ]);
    const stale = await prisma.order.findMany({
      where: { status: "AWAITING_PAYMENT", paymentIntentId: null, createdAt: { lt: cutoff } },
      select: { id: true },
    });
    let cancelled = 0;
    for (const o of stale) {
      // libera anche l'eventuale codice sconto prenotato
      if (await failPendingOrder(o.id, "CANCELLED")) cancelled++;
    }
    return res.status(200).json({
      success: true,
      deletedCartItems: items.count,
      deletedCarts: carts.count,
      cancelledAbandonedCheckouts: cancelled,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("❌ Errore pulizia carrelli:", error);
    return res.status(500).json({ success: false, error: "Errore durante la pulizia dei carrelli" });
  }
}
