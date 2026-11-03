import { StatoLibroCliente } from "@prisma/client";

// Regole del Magazzino (ex Magazzino di GS_MAG), separate dalle rotte per poterle testare.

/** Quantità scritta a mano: intero da 0 a 9999, altrimenti null. */
export function leggiQuantita(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  return Number(s);
}

/**
 * Libri che si possono dare dal negozio: quelli che il cliente non ha ancora in mano. Se era già ordinato
 * («Confermato») la copia in ordine passa al prossimo che lo aspetta.
 */
export const daDareDalNegozio = (stato: StatoLibroCliente) => stato === "IN_LISTA" || stato === "PRENOTATO" || stato === "CONFERMATO";

/** Codice letto con lo scanner o scritto a mano, come nelle schede: senza spazi e trattini. */
export const normalizzaIsbn = (v: unknown) => String(v ?? "").replace(/[\s-]/g, "").toUpperCase();

/** Conta le righe per codice (prenotati, in ordine, da ritirare…). */
export function contaPerCodice(righe: { isbn: string }[]) {
  const conti = new Map<string, number>();
  for (const r of righe) conti.set(r.isbn, (conti.get(r.isbn) ?? 0) + 1);
  return conti;
}
