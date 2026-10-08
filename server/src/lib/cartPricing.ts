import prisma from "./prisma";
import { effectivePrice, discountPercent, roundMoney, toNumber } from "./pricing";
import {
  getSettings,
  shippingCostFor,
  shippingMethodError,
  ShippingMethod,
  StoreSettings,
} from "./settings";
import { evaluateCoupon } from "./coupons";
import { parseId } from "./http";

export type SelectedVariants = Record<string, { id: number; nome: string; immagine?: string | null }>;
export type PaymentMethod = "stripe" | "contrassegno";

export interface CartLineInput {
  productId: number | string;
  quantity: number | string;
  selectedVariants?: SelectedVariants | null;
  personalizzazione?: string | null;
}

export interface PricedLine {
  key: string;
  productId: number;
  titolo: string;
  immagine: string | null;
  quantity: number;
  prezzoUnitario: number;
  prezzoListino: number;
  scontoPercentuale: number | null;
  lineTotal: number;
  variantKey: string;
  selectedVariants: SelectedVariants | null;
  variantLabel: string;
  personalizzazione: string | null;
  categoryIds: number[];
  available: boolean;
  maxPerOrdine: number | null;
  omaggio?: boolean;
  error?: string;
}

export interface CartQuote {
  items: PricedLine[];
  omaggio: PricedLine | null;
  subtotal: number;
  /** Risparmio dovuto ai prezzi in offerta (listino - pagato) */
  risparmio: number;
  shipping: number;
  shippingMethod: ShippingMethod;
  shippingError: string | null;
  paymentMethod: PaymentMethod;
  paymentFee: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  giftThreshold: number | null;
  remainingForGift: number | null;
  coupon: { code: string; discount: number; label: string; promotionId: number } | null;
  couponError: string | null;
  total: number;
  errors: string[];
  itemCount: number;
}

export const MAX_QTY = 99;
export const MAX_PERSONALIZZAZIONE = 120;

export const cleanPersonalization = (value: unknown): string | null => {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PERSONALIZZAZIONE);
  return text || null;
};

/**
 * Firma stabile della riga: varianti scelte ("typeId:valueId|...") più l'eventuale
 * testo di personalizzazione. Stesso prodotto con opzioni diverse = righe diverse.
 */
export const variantKeyOf = (
  selected?: SelectedVariants | null,
  personalizzazione?: string | null
): string => {
  const variants = selected
    ? Object.entries(selected)
        .map(([typeId, v]) => `${parseInt(typeId, 10)}:${v?.id}`)
        .sort()
        .join("|")
    : "";
  const text = cleanPersonalization(personalizzazione);
  return text ? `${variants}#${text.toLowerCase()}` : variants;
};

const productSelect = {
  id: true,
  titolo: true,
  immagine: true,
  prezzo: true,
  prezzoScontato: true,
  scontoInizio: true,
  scontoFine: true,
  available: true,
  personalizzabile: true,
  maxPerOrdine: true,
  categoria: { select: { id: true } },
  varianti: {
    select: { id: true, nome: true, valori: { select: { id: true, nome: true, immagine: true } } },
  },
} as const;

/**
 * Ricalcola il carrello lato server partendo da id prodotto, quantità e opzioni.
 * I prezzi inviati dal browser vengono ignorati: valgono solo quelli del database.
 */
export const priceCart = async (
  input: CartLineInput[],
  opts: {
    couponCode?: string | null;
    shippingMethod?: ShippingMethod;
    paymentMethod?: PaymentMethod;
    cap?: string | null;
    settings?: StoreSettings;
  } = {}
): Promise<CartQuote> => {
  const settings = opts.settings || (await getSettings());
  const shippingMethod: ShippingMethod =
    opts.shippingMethod === "ritiro" || opts.shippingMethod === "giornata" ? opts.shippingMethod : "spedizione";
  const paymentMethod: PaymentMethod =
    opts.paymentMethod === "contrassegno" ? "contrassegno" : "stripe";

  const lines = (Array.isArray(input) ? input : [])
    .filter((l): l is CartLineInput => !!l && typeof l === "object")
    .slice(0, 100);
  const ids = [...new Set(lines.map((l) => parseId(l.productId)).filter((n) => !isNaN(n)))];
  const giftId = settings.omaggio.attivo ? settings.omaggio.prodottoId : null;
  const products = ids.length || giftId
    ? await prisma.product.findMany({
        where: { id: { in: giftId ? [...ids, giftId] : ids } },
        select: productSelect,
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const now = new Date();
  const errors: string[] = [];
  const merged = new Map<string, PricedLine>();

  for (const line of lines) {
    const productId = parseId(line.productId);
    const product = byId.get(productId);
    const quantity = Math.min(MAX_QTY, Math.max(1, parseInt(String(line.quantity), 10) || 1));
    if (!product) {
      errors.push("Un prodotto nel carrello non esiste più ed è stato rimosso.");
      continue;
    }

    // Validazione varianti: ogni tipo con valori deve averne uno scelto e valido
    let lineError: string | undefined;
    const selected: SelectedVariants = {};
    const labels: string[] = [];
    for (const type of product.varianti) {
      const chosen = line.selectedVariants?.[String(type.id)];
      const value = chosen ? type.valori.find((v) => v.id === Number(chosen.id)) : undefined;
      if (!value) {
        if (type.valori.length) lineError = `Scegli "${type.nome.trim()}" per ${product.titolo}.`;
        continue;
      }
      selected[String(type.id)] = { id: value.id, nome: value.nome, immagine: value.immagine };
      labels.push(`${type.nome.trim()}: ${value.nome.trim()}`);
    }
    const personalizzazione = product.personalizzabile ? cleanPersonalization(line.personalizzazione) : null;
    if (!product.available) lineError = `${product.titolo} non è al momento disponibile.`;

    const selectedOrNull = Object.keys(selected).length ? selected : null;
    const variantKey = variantKeyOf(selectedOrNull, personalizzazione);
    const key = `${product.id}::${variantKey}`;
    const unit = effectivePrice(product, now);
    const existing = merged.get(key);
    const qty = Math.min(MAX_QTY, (existing?.quantity || 0) + quantity);
    const variantImage = Object.values(selected).find((v) => v.immagine)?.immagine;

    merged.set(key, {
      key,
      productId: product.id,
      titolo: product.titolo,
      immagine: variantImage || product.immagine,
      quantity: qty,
      prezzoUnitario: unit,
      prezzoListino: toNumber(product.prezzo),
      scontoPercentuale: discountPercent(product, now),
      lineTotal: roundMoney(unit * qty),
      variantKey,
      selectedVariants: selectedOrNull,
      variantLabel: labels.join(", "),
      personalizzazione,
      categoryIds: product.categoria.map((c) => c.id),
      available: product.available,
      maxPerOrdine: product.maxPerOrdine,
      error: existing?.error || lineError,
    });
  }

  const items = [...merged.values()];

  // Limite di acquisto per prodotto (somma di tutte le varianti)
  const qtyByProduct = new Map<number, number>();
  items.forEach((i) => qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) || 0) + i.quantity));
  for (const item of items) {
    if (item.maxPerOrdine && (qtyByProduct.get(item.productId) || 0) > item.maxPerOrdine && !item.error) {
      item.error = `Puoi acquistare al massimo ${item.maxPerOrdine} pezzi di ${item.titolo} per ordine.`;
    }
  }
  items.forEach((i) => i.error && errors.push(i.error));

  const valid = items.filter((i) => !i.error);
  const subtotal = roundMoney(valid.reduce((s, i) => s + i.lineTotal, 0));
  const risparmio = roundMoney(
    valid.reduce((s, i) => s + (i.prezzoListino - i.prezzoUnitario) * i.quantity, 0)
  );

  let coupon: CartQuote["coupon"] = null;
  let couponError: string | null = null;
  if (opts.couponCode) {
    const result = await evaluateCoupon(
      opts.couponCode,
      valid.map((i) => ({ productId: i.productId, categoryIds: i.categoryIds, lineTotal: i.lineTotal })),
      now
    );
    if (result.ok) {
      coupon = { code: result.code, discount: result.discount, label: result.label, promotionId: result.promotionId };
    }
    else couponError = result.message;
  }

  // Omaggio automatico sopra soglia (calcolata sul subtotale prodotti)
  let omaggio: PricedLine | null = null;
  const giftProduct = giftId ? byId.get(giftId) : undefined;
  if (giftProduct && giftProduct.available && valid.length && subtotal >= settings.omaggio.soglia) {
    omaggio = {
      key: `${giftProduct.id}::omaggio`,
      productId: giftProduct.id,
      titolo: giftProduct.titolo,
      immagine: giftProduct.immagine,
      quantity: 1,
      prezzoUnitario: 0,
      prezzoListino: toNumber(giftProduct.prezzo),
      scontoPercentuale: 100,
      lineTotal: 0,
      variantKey: "omaggio",
      selectedVariants: null,
      variantLabel: "Omaggio",
      personalizzazione: null,
      categoryIds: giftProduct.categoria.map((c) => c.id),
      available: true,
      maxPerOrdine: null,
      omaggio: true,
    };
  }

  const shippingError = valid.length ? shippingMethodError(settings, shippingMethod, opts.cap, now) : null;
  const shipping = valid.length ? shippingCostFor(settings, subtotal, shippingMethod) : 0;
  const paymentFee =
    paymentMethod === "contrassegno" && valid.length ? settings.pagamenti.contrassegno.commissione : 0;
  const total = roundMoney(Math.max(0, subtotal - (coupon?.discount || 0)) + shipping + paymentFee);

  return {
    items,
    omaggio,
    subtotal,
    risparmio,
    shipping,
    shippingMethod,
    shippingError,
    paymentMethod,
    paymentFee,
    freeShippingThreshold: settings.spedizione.sogliaGratuita,
    remainingForFreeShipping: roundMoney(Math.max(0, settings.spedizione.sogliaGratuita - subtotal)),
    giftThreshold: giftProduct && giftProduct.available ? settings.omaggio.soglia : null,
    remainingForGift:
      giftProduct && giftProduct.available ? roundMoney(Math.max(0, settings.omaggio.soglia - subtotal)) : null,
    coupon,
    couponError,
    total,
    errors: [...new Set(errors)],
    itemCount: valid.reduce((s, i) => s + i.quantity, 0),
  };
};
