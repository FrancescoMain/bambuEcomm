import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { roundMoney, toNumber } from "./pricing";
import { withDescendants } from "./catalog";

export interface CouponLine {
  productId: number;
  categoryIds: number[];
  lineTotal: number;
}

export type CouponResult =
  | {
      ok: true;
      code: string;
      promotionId: number;
      discount: number;
      label: string;
    }
  | { ok: false; message: string };

const promotionInclude = {
  products: { select: { id: true } },
  categories: { select: { id: true } },
} satisfies Prisma.PromotionInclude;

export const normalizeCode = (code: unknown) =>
  String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

/**
 * Verifica un codice sconto sul carrello e calcola lo sconto.
 * Se la promozione è legata a prodotti/categorie, lo sconto vale solo su quelle righe.
 */
export const evaluateCoupon = async (
  rawCode: unknown,
  lines: CouponLine[],
  now = new Date()
): Promise<CouponResult> => {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, message: "Inserisci un codice sconto." };

  const promo = await prisma.promotion.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: promotionInclude,
  });
  if (!promo || !promo.isActive) return { ok: false, message: "Codice sconto non valido." };
  if (promo.startDate > now) return { ok: false, message: "Questo codice non è ancora attivo." };
  if (promo.endDate < now) return { ok: false, message: "Questo codice è scaduto." };
  if (promo.maxUtilizzi !== null && promo.utilizzi >= promo.maxUtilizzi) {
    return { ok: false, message: "Questo codice ha raggiunto il numero massimo di utilizzi." };
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const minimo = promo.minimoOrdine ? toNumber(promo.minimoOrdine) : 0;
  if (subtotal < minimo) {
    return {
      ok: false,
      message: `Il codice è valido per ordini da almeno ${minimo.toFixed(2).replace(".", ",")} €.`,
    };
  }

  // Righe a cui si applica lo sconto
  let eligible = lines;
  if (promo.products.length || promo.categories.length) {
    const productIds = new Set(promo.products.map((p) => p.id));
    const categoryIds = new Set(await withDescendants(promo.categories.map((c) => c.id)));
    eligible = lines.filter(
      (l) => productIds.has(l.productId) || l.categoryIds.some((id) => categoryIds.has(id))
    );
    if (!eligible.length) {
      return { ok: false, message: "Il codice non si applica ai prodotti nel carrello." };
    }
  }
  const base = eligible.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let label = "";
  if (promo.discountPercentage) {
    const pct = toNumber(promo.discountPercentage);
    discount = base * (pct / 100);
    label = `-${pct % 1 === 0 ? pct.toFixed(0) : pct}%`;
  } else if (promo.discountAmount) {
    discount = toNumber(promo.discountAmount);
    label = `-${discount.toFixed(2).replace(".", ",")} €`;
  }
  discount = roundMoney(Math.min(discount, base));
  if (discount <= 0) return { ok: false, message: "Codice sconto non valido." };

  return { ok: true, code: promo.code || code, promotionId: promo.id, discount, label };
};

/**
 * Prenota un utilizzo del codice in modo atomico (alla creazione dell'ordine):
 * se nel frattempo il limite è stato raggiunto, l'aggiornamento non trova righe.
 */
export const reserveCoupon = async (promotionId: number): Promise<boolean> => {
  const updated = await prisma.$executeRaw`
    UPDATE "Promotion" SET "utilizzi" = "utilizzi" + 1
    WHERE id = ${promotionId} AND "isActive" = TRUE
      AND ("maxUtilizzi" IS NULL OR "utilizzi" < "maxUtilizzi")`;
  return updated > 0;
};

/** Restituisce l'utilizzo prenotato (pagamento non completato, sessione scaduta…). */
export const releaseCoupon = async (promotionId: number | null | undefined): Promise<void> => {
  if (!promotionId) return;
  await prisma.$executeRaw`
    UPDATE "Promotion" SET "utilizzi" = GREATEST("utilizzi" - 1, 0) WHERE id = ${promotionId}`;
};
