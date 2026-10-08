import { Prisma } from "@prisma/client";

type Money = Prisma.Decimal | number | string | null | undefined;

export interface DiscountFields {
  prezzo: Money;
  prezzoScontato?: Money;
  scontoInizio?: Date | string | null;
  scontoFine?: Date | string | null;
}

export const toNumber = (value: Money): number => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
};

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Lo sconto è attivo se il prezzo scontato è valorizzato, è inferiore al
 * prezzo pieno e la data corrente cade nell'eventuale finestra inizio/fine.
 */
export const isDiscountActive = (p: DiscountFields, now = new Date()): boolean => {
  if (p.prezzoScontato === null || p.prezzoScontato === undefined) return false;
  const sale = toNumber(p.prezzoScontato);
  const full = toNumber(p.prezzo);
  if (!(sale > 0 && sale < full)) return false;
  if (p.scontoInizio && new Date(p.scontoInizio) > now) return false;
  if (p.scontoFine && new Date(p.scontoFine) < now) return false;
  return true;
};

/** Prezzo effettivamente pagato dal cliente. */
export const effectivePrice = (p: DiscountFields, now = new Date()): number =>
  isDiscountActive(p, now) ? toNumber(p.prezzoScontato) : toNumber(p.prezzo);

/** Percentuale di sconto arrotondata all'intero (per il badge "-20%"). */
export const discountPercent = (p: DiscountFields, now = new Date()): number | null => {
  if (!isDiscountActive(p, now)) return null;
  const full = toNumber(p.prezzo);
  const sale = toNumber(p.prezzoScontato);
  return Math.round(((full - sale) / full) * 100);
};

/** Prezzo scontato a partire da una percentuale (es. 20 => -20%). */
export const priceFromPercent = (fullPrice: number, percent: number): number =>
  roundMoney(fullPrice * (1 - percent / 100));

/**
 * Converte i campi prezzo di un prodotto in numeri e aggiunge i campi calcolati
 * usati dal frontend (prezzoFinale, scontoPercentuale, inOfferta).
 */
export function withPricing<T extends DiscountFields>(product: T, now = new Date()) {
  const active = isDiscountActive(product, now);
  return {
    ...product,
    prezzo: toNumber(product.prezzo),
    prezzoScontato:
      product.prezzoScontato === null || product.prezzoScontato === undefined
        ? null
        : toNumber(product.prezzoScontato),
    prezzoFinale: active ? toNumber(product.prezzoScontato) : toNumber(product.prezzo),
    scontoPercentuale: discountPercent(product, now),
    inOfferta: active,
  };
}

/**
 * Filtro Prisma per i prodotti con sconto attivo in questo momento.
 * Il confronto prezzoScontato < prezzo non è esprimibile in Prisma, quindi
 * quel controllo è garantito in scrittura (vedi validateDiscount).
 */
export const activeDiscountWhere = (now = new Date()): Prisma.ProductWhereInput => ({
  prezzoScontato: { not: null },
  AND: [
    { OR: [{ scontoInizio: null }, { scontoInizio: { lte: now } }] },
    { OR: [{ scontoFine: null }, { scontoFine: { gte: now } }] },
  ],
});

/** Valida i dati di uno sconto prima di salvarlo. Restituisce un errore leggibile o null. */
export const validateDiscount = (
  fullPrice: number,
  salePrice: number | null,
  start?: Date | null,
  end?: Date | null
): string | null => {
  if (salePrice === null) return null;
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return "Il prezzo scontato deve essere maggiore di zero.";
  }
  if (salePrice >= fullPrice) {
    return "Il prezzo scontato deve essere inferiore al prezzo pieno.";
  }
  if (start && end && end <= start) {
    return "La data di fine sconto deve essere successiva alla data di inizio.";
  }
  return null;
};
