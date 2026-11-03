import { Prisma, StatoLibroCliente } from "@prisma/client";
import prisma from "./prisma";

// Regole dei libri usati (comprati al banco in conto vendita e rivenduti ai clienti), separate dalle rotte per poterle
// testare. Chiamata con il negozio del 3 nov 2026: percentuali scritte copia per copia, il venditore si paga solo
// quando la copia è venduta, chi aspetta l'usato passa al nuovo dopo qualche giorno.

const arrotonda = (n: number) => Math.round(n * 100) / 100;

/** Percentuale scritta a mano («50», «37,5»), da 0 a 100; altrimenti null. */
export function leggiPercentuale(v: unknown): number | null {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n <= 100 ? n : null;
}

/** Prezzi della copia dal prezzo di copertina: vendita = copertina meno lo sconto, acquisto = percentuale della copertina. */
export function prezziUsato(copertina: number, scontoVendita: number, percentualeAcquisto: number) {
  return {
    prezzoVendita: arrotonda(copertina * (1 - scontoVendita / 100)),
    prezzoAcquisto: arrotonda((copertina * percentualeAcquisto) / 100),
  };
}

/** Codice nostro della copia: anno + progressivo su 6 cifre (2026, 12 → «2026000012»). */
export const codiceCopia = (anno: number, numero: number) => `${anno}${String(numero).padStart(6, "0")}`;

/** Il codice di una copia usata letto col lettore: 10 cifre. */
export const eCodiceCopia = (testo: string) => /^\d{10}$/.test(testo);

/** Fino a quando chi ha scelto l'usato non va ancora ordinato nuovo: chi lo aspetta da dopo questa data. */
export const sogliaAttesa = (giorni: number, adesso = new Date()) => new Date(adesso.getTime() - giorni * 24 * 60 * 60 * 1000);

/**
 * Libri che vanno trattati come «nuovo»: chi non vuole l'usato, oppure lo aspetta da più dei giorni impostati.
 * Servono a «Da ordinare» e a chi riceve una copia nuova libera (bolla, annullo d'ordine).
 */
export const vuoleIlNuovo = (soglia: Date): Prisma.SchedaClienteLibroWhereInput => ({
  OR: [{ usato: false }, { usatoDal: null }, { usatoDal: { lte: soglia } }],
});

export type StatoCopia = "IN_NEGOZIO" | "ASSEGNATA" | "VENDUTA" | "PAGATA";

/** A che punto è una copia: in negozio, data a un cliente, venduta (il cliente l'ha ritirata), pagata al venditore. */
export function statoCopia(c: { libroId: number | null; pagataAt: Date | null; libro: { stato: StatoLibroCliente } | null }): StatoCopia {
  if (c.pagataAt) return "PAGATA";
  if (!c.libroId || !c.libro) return "IN_NEGOZIO";
  return c.libro.stato === "RITIRATO" ? "VENDUTA" : "ASSEGNATA";
}

/** Conti del venditore: quanto gli si deve (copie vendute e non pagate) e quanto gli è già stato dato. */
export function contiVenditore(copie: { stato: StatoCopia; prezzoAcquisto: Prisma.Decimal | number | string }[]) {
  const somma = (s: StatoCopia) => arrotonda(copie.filter((c) => c.stato === s).reduce((t, c) => t + Number(c.prezzoAcquisto), 0));
  const conta = (s: StatoCopia) => copie.filter((c) => c.stato === s).length;
  return {
    inNegozio: conta("IN_NEGOZIO") + conta("ASSEGNATA"),
    vendute: conta("VENDUTA") + conta("PAGATA"),
    daPagare: somma("VENDUTA"),
    pagato: somma("PAGATA"),
  };
}

const CHIAVE = "libri_usato";
export const GIORNI_PREDEFINITI = 10;

/** Giorni di attesa dell'usato prima di ordinarlo nuovo (impostabile: nella chiamata si è parlato di 10, 7 e 5). */
export async function giorniAttesa(db: Prisma.TransactionClient = prisma) {
  const s = await db.setting.findUnique({ where: { key: CHIAVE } });
  const g = Number((s?.value as { giorniAttesa?: unknown } | null)?.giorniAttesa);
  return Number.isInteger(g) && g >= 0 && g <= 365 ? g : GIORNI_PREDEFINITI;
}

export async function salvaGiorniAttesa(giorni: number) {
  await prisma.setting.upsert({ where: { key: CHIAVE }, create: { key: CHIAVE, value: { giorniAttesa: giorni } }, update: { value: { giorniAttesa: giorni } } });
}
