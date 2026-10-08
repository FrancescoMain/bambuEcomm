import { formatPrice } from "@/lib/format";
import type { DiscountTarget } from "./types";

// ---------------------------------------------------------------------------
// Prezzi (stessi arrotondamenti del server: lib/pricing.ts)
// ---------------------------------------------------------------------------

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** 12,50 € con sconto del 20% => 10,00 € */
export const priceFromPercent = (fullPrice: number, percent: number) =>
  roundMoney(fullPrice * (1 - percent / 100));

/** Percentuale arrotondata all'intero, come il badge "-20%" del negozio */
export const percentFromPrice = (fullPrice: number, salePrice: number) =>
  fullPrice > 0 ? Math.round(((fullPrice - salePrice) / fullPrice) * 100) : 0;

/** Accetta "12,50", "12.5", "1.234,50", " 9 " => numero (null se vuoto o non valido) */
export const parseDecimal = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let s = value.trim().replace(/\s|€/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** Numero intero positivo da un campo testo (null se vuoto/non valido) */
export const parseIntSafe = (value: string): number | null => {
  const s = value.trim();
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
};

/** 12.5 => "12,50" per i campi di testo */
export const moneyInput = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : value.toFixed(2).replace(".", ",");

/** Valore iniziale del modulo sconto a partire dal prodotto */
export const initialDiscountInput = (prezzo: number, prezzoScontato: number | null) => {
  if (prezzoScontato === null || !(prezzoScontato < prezzo)) {
    return { mode: "percent" as const, value: "" };
  }
  const pct = percentFromPrice(prezzo, prezzoScontato);
  // Se il prezzo scontato deriva da una percentuale "tonda", la mostriamo come tale
  if (pct > 0 && pct < 100 && priceFromPercent(prezzo, pct) === prezzoScontato) {
    return { mode: "percent" as const, value: String(pct) };
  }
  return { mode: "price" as const, value: moneyInput(prezzoScontato) };
};

export type DiscountMode = "percent" | "price";

/** Calcola il prezzo scontato e controlla i valori inseriti */
export const computeSale = (
  fullPrice: number | null,
  mode: DiscountMode,
  raw: string
): { salePrice: number | null; percent: number | null; error: string | null } => {
  const value = parseDecimal(raw);
  if (value === null) {
    return { salePrice: null, percent: null, error: raw.trim() ? "Inserisci un numero valido." : null };
  }
  if (mode === "percent") {
    if (value <= 0 || value >= 100) return { salePrice: null, percent: null, error: "La percentuale deve essere tra 1 e 99." };
    if (!fullPrice) return { salePrice: null, percent: value, error: null };
    const salePrice = priceFromPercent(fullPrice, value);
    if (salePrice <= 0) return { salePrice: null, percent: value, error: "Il prezzo scontato sarebbe zero." };
    return { salePrice, percent: value, error: null };
  }
  if (value <= 0) return { salePrice: null, percent: null, error: "Il prezzo scontato deve essere maggiore di zero." };
  if (fullPrice && value >= fullPrice) {
    return {
      salePrice: null,
      percent: null,
      error: `Il prezzo scontato deve essere inferiore al prezzo pieno (${formatPrice(fullPrice)}).`,
    };
  }
  return { salePrice: roundMoney(value), percent: fullPrice ? percentFromPrice(fullPrice, value) : null, error: null };
};

// ---------------------------------------------------------------------------
// Date (i campi <input type="date"> lavorano con "AAAA-MM-GG" in ora locale)
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

export const isoToDateInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Inizio giornata per la data di partenza, fine giornata per quella di fine */
export const dateInputToIso = (value: string, endOfDay = false): string | null => {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = endOfDay
    ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 0)
    : new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0);
  return d.toISOString();
};

export const todayInput = () => isoToDateInput(new Date().toISOString());

/** Controllo delle date di un periodo (vuote = nessun limite) */
export const dateRangeError = (start: string, end: string): string | null => {
  if (start && end && end < start) return "La data di fine deve essere uguale o successiva a quella di inizio.";
  return null;
};

export const isPastDate = (value: string) => !!value && value < todayInput();

/** "12 ott" (anno solo se diverso da quello corrente) */
export const formatShortDate = (value: string | Date) => {
  const d = new Date(value);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Europe/Rome",
  });
};

/** Le date oltre il 2090 sono il "per sempre" del server (coupon senza scadenza) */
export const isOpenEnded = (iso: string | null | undefined) => !iso || new Date(iso).getFullYear() >= 2090;

// ---------------------------------------------------------------------------
// Stato dello sconto di un prodotto
// ---------------------------------------------------------------------------

export type DiscountInfo =
  | { state: "none" }
  | { state: "active"; percent: number | null; end: string | null }
  | { state: "scheduled"; percent: number; start: string; end: string | null }
  | { state: "expired"; end: string };

export const discountInfo = (p: DiscountTarget, now = new Date()): DiscountInfo => {
  if (p.prezzoScontato === null || p.prezzoScontato === undefined) return { state: "none" };
  if (p.inOfferta) return { state: "active", percent: p.scontoPercentuale, end: p.scontoFine ?? null };
  if (p.scontoInizio && new Date(p.scontoInizio) > now) {
    return {
      state: "scheduled",
      percent: percentFromPrice(p.prezzo, p.prezzoScontato),
      start: p.scontoInizio,
      end: p.scontoFine ?? null,
    };
  }
  if (p.scontoFine && new Date(p.scontoFine) < now) return { state: "expired", end: p.scontoFine };
  return { state: "none" };
};

/** Copia i campi prezzo aggiornati (risposta API) dentro un elemento di lista */
export const mergePricing = <T extends DiscountTarget>(item: T, updated: DiscountTarget): T => ({
  ...item,
  prezzo: updated.prezzo,
  prezzoScontato: updated.prezzoScontato,
  prezzoFinale: updated.prezzoFinale,
  scontoPercentuale: updated.scontoPercentuale,
  inOfferta: updated.inOfferta,
  scontoInizio: updated.scontoInizio ?? null,
  scontoFine: updated.scontoFine ?? null,
});

/** Le immagini importate possono essere percorsi non validi: next/image li rifiuterebbe */
export const isValidImageSrc = (src: string | null | undefined): src is string =>
  !!src && (/^https?:\/\//i.test(src) || src.startsWith("/"));

export const pluralize = (n: number, one: string, many: string) => `${n.toLocaleString("it-IT")} ${n === 1 ? one : many}`;
