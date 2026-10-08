import prisma from "../lib/prisma";
import emailService from "./emailService";
import { productUrl } from "../lib/urls";
import { runInBackground } from "../lib/http";

/**
 * Invia l'email "è tornato disponibile" a chi l'aveva richiesta.
 * Non blocca la risposta HTTP: gli errori vengono solo loggati.
 */
export const notifyBackInStock = (productId: number): void => {
  runInBackground(
    (async () => {
    try {
      const [product, alerts] = await Promise.all([
        prisma.product.findUnique({
          where: { id: productId },
          select: { id: true, titolo: true, immagine: true, available: true },
        }),
        prisma.stockAlert.findMany({
          where: { productId, notifiedAt: null },
          select: { id: true, email: true },
        }),
      ]);
      if (!product || !product.available || alerts.length === 0) return;

      const url = productUrl(product.id, product.titolo);
      const sent: number[] = [];
      for (const alert of alerts) {
        const ok = await emailService.sendBackInStockEmail({
          email: alert.email,
          productName: product.titolo,
          productImage: product.immagine || undefined,
          productUrl: url,
        });
        if (ok) sent.push(alert.id);
      }
      if (sent.length) {
        await prisma.stockAlert.updateMany({
          where: { id: { in: sent } },
          data: { notifiedAt: new Date() },
        });
      }
    } catch (error) {
      console.error("Errore invio avvisi disponibilità:", error);
    }
    })()
  );
};
