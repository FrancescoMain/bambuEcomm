const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** 12.5 -> "12,50 €" */
export const formatPrice = (value: number | string | null | undefined): string => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  return euroFormatter.format(Number.isFinite(n) ? n : 0);
};

export const toNumber = (value: number | string | null | undefined): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export const formatDate = (value: string | Date, opts?: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
    ...opts,
  });

export const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

export const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Slug del prodotto per l'URL, tagliato a parola intera (max ~80 caratteri) */
export const productSlug = (titolo: string, max = 80): string => {
  const words = slugify(titolo).split("-").filter(Boolean);
  let out = "";
  for (const w of words) {
    if ((out ? out.length + 1 : 0) + w.length > max) break;
    out = out ? `${out}-${w}` : w;
  }
  return out || slugify(titolo).slice(0, max);
};

/** Pulizia minima per descrizioni importate (spazi multipli, trattini doppi) */
export const cleanText = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "In attesa",
  AWAITING_PAYMENT: "In attesa di pagamento",
  PROCESSING: "In preparazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  FAILED: "Pagamento non riuscito",
  REFUNDED: "Rimborsato",
};

export const ORDER_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-orange-soft text-orange-ink",
  AWAITING_PAYMENT: "bg-paper-warm text-ink-muted",
  PROCESSING: "bg-sky-soft text-sky-ink",
  SHIPPED: "bg-brand-50 text-brand-700",
  DELIVERED: "bg-brand-100 text-brand-800",
  CANCELLED: "bg-magenta-soft text-magenta-ink",
  FAILED: "bg-magenta-soft text-magenta-ink",
  REFUNDED: "bg-paper-warm text-ink-soft",
};

/** Sostituisce {soglia} nei testi del pannello con la soglia di spedizione gratuita attuale */
export const withThreshold = (text: string, soglia: number) =>
  text.replace(/\{soglia\}/g, formatPrice(soglia).replace(",00", ""));
