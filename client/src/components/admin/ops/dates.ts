import { differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import { it } from "date-fns/locale";

/** "3 ore fa", "2 giorni fa" */
export const timeAgo = (value: string | Date): string => {
  const date = new Date(value);
  if (Date.now() - date.getTime() < 60_000) return "adesso";
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: it });
};

/** Giorni di calendario da oggi alla data (negativo se già passata) */
export const daysFromToday = (value: string | Date): number => differenceInCalendarDays(new Date(value), new Date());

export const addDays = (value: string | Date, days: number): Date => {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
};

/** Aggiunge giorni lavorativi (lun-ven) */
export const addBusinessDays = (from: Date, days: number): Date => {
  const d = new Date(from);
  let left = Math.max(0, Math.round(days));
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO -> valore per <input type="datetime-local"> (ora locale) */
export const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Valore di <input type="datetime-local"> -> ISO (o null se vuoto) */
export const fromLocalInput = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
