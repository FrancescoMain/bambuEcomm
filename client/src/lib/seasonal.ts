import type { CategoryNode, SeasonalTheme, StoreSettings } from "./types";

/** Tema in corso e la sua categoria (se scelta nel pannello ed esistente) */
export type ActiveSeason = { tema: SeasonalTheme; category: CategoryNode | null };

/** Data di oggi a Roma nel formato AAAA-MM-GG (il periodo segue il calendario del negozio) */
export const romeToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** Tema stagionale da applicare adesso, oppure null (interruttore spento o fuori dal periodo) */
export const activeSeasonalTheme = (
  t: StoreSettings["temaStagionale"] | undefined,
  now = new Date()
): SeasonalTheme | null => {
  if (!t?.attivo) return null;
  const today = romeToday(now);
  if (t.inizio && today < t.inizio) return null;
  if (t.fine && today > t.fine) return null;
  return t.tema;
};
