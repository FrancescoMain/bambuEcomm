import { Prisma } from "@prisma/client";
import prisma from "./prisma";

// Dati di un libro da un codice già visto nel gestionale: prima nelle classi (dati del Ministero), poi nelle schede
// dei clienti (inseriti a mano), poi nel magazzino.

const DATI = { isbn: true, materia: true, autori: true, titolo: true, volume: true, editore: true, prezzo: true } as const;
export type DatiLibro = Prisma.SchedaScuolaLibroGetPayload<{ select: typeof DATI }>;

export async function datiLibri(codici: string[], db: Prisma.TransactionClient = prisma) {
  const trovati = new Map<string, DatiLibro>();
  const mancanti = () => codici.filter((c) => !trovati.has(c));
  const ordine = { updatedAt: "desc" } as const;
  // Le righe più recenti per prime: per ogni codice vince la prima incontrata
  const aggiungi = (righe: DatiLibro[]) => righe.forEach((r) => trovati.has(r.isbn) || trovati.set(r.isbn, r));
  if (mancanti().length) aggiungi(await db.schedaScuolaLibro.findMany({ where: { isbn: { in: mancanti() } }, orderBy: ordine, select: DATI }));
  if (mancanti().length) aggiungi(await db.schedaClienteLibro.findMany({ where: { isbn: { in: mancanti() } }, orderBy: ordine, select: DATI }));
  if (mancanti().length) aggiungi(await db.giacenzaLibro.findMany({ where: { isbn: { in: mancanti() } }, orderBy: ordine, select: DATI }));
  return trovati;
}
