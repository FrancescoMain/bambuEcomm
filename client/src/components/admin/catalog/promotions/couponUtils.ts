import { formatPrice } from "@/lib/format";
import type { Coupon } from "../types";
import { formatShortDate, isOpenEnded } from "../utils";

export type CouponState = "attivo" | "programmato" | "scaduto" | "esaurito" | "disattivato";

export const couponState = (c: Coupon, now = new Date()): CouponState => {
  if (!c.attivo) return "disattivato";
  if (new Date(c.inizio) > now) return "programmato";
  if (new Date(c.fine) < now) return "scaduto";
  if (c.maxUtilizzi !== null && c.utilizzi >= c.maxUtilizzi) return "esaurito";
  return "attivo";
};

export const COUPON_STATE: Record<CouponState, { label: string; tone: string }> = {
  attivo: { label: "Attivo", tone: "bg-brand-50 text-brand-700" },
  programmato: { label: "Programmato", tone: "bg-sky-soft text-sky-ink" },
  scaduto: { label: "Scaduto", tone: "bg-paper-warm text-ink-muted" },
  esaurito: { label: "Esaurito", tone: "bg-orange-soft text-orange-ink" },
  disattivato: { label: "Disattivato", tone: "bg-paper-warm text-ink-muted" },
};

/** "-10%" oppure "-5,00 €" */
export const couponValue = (tipo: Coupon["tipo"], valore: number) =>
  tipo === "percentuale" ? `-${valore % 1 === 0 ? valore : valore.toLocaleString("it-IT")}%` : `-${formatPrice(valore)}`;

export const couponValidity = (c: Pick<Coupon, "inizio" | "fine">, now = new Date()) => {
  const started = new Date(c.inizio) <= now;
  const end = isOpenEnded(c.fine) ? null : formatShortDate(c.fine);
  if (!started) return end ? `dal ${formatShortDate(c.inizio)} al ${end}` : `dal ${formatShortDate(c.inizio)}`;
  return end ? `fino al ${end}` : "senza scadenza";
};

/** Codice casuale leggibile (senza 0/O e 1/I che si confondono) */
export const randomCode = (prefix = "BAMBU") => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${out}`;
};

export const normalizeCode = (value: string) => value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9_-]/g, "");
