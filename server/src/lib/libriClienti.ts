import { Prisma, StatoLibroCliente } from "@prisma/client";
import { normalizzaClasse } from "./miur";

// Regole delle schede cliente (ex Schede Clienti di GS_MAG), separate dalle rotte per poterle testare.

/** Barcode della scheda come in GS_MAG: anno + numero su 9 cifre (2026, 12 → «2026000000012»). */
export const barcodeScheda = (anno: number, numero: number) => `${anno}${String(numero).padStart(9, "0")}`;

/** Il contrario di barcodeScheda: 13 cifre → anno e numero, altrimenti null. */
export function leggiBarcode(testo: unknown): { anno: number; numero: number } | null {
  const m = /^(\d{4})(\d{9})$/.exec(String(testo ?? "").trim());
  if (!m) return null;
  const numero = Number(m[2]);
  return numero > 0 ? { anno: Number(m[1]), numero } : null;
}

export type AzioneLibro = "prenota" | "togli" | "ritira" | "annullaRitiro";
export const AZIONI: readonly AzioneLibro[] = ["prenota", "togli", "ritira", "annullaRitiro"];

/**
 * Passaggi di stato che si fanno dalla scheda cliente. Confermato (ordine inoltrato) e Assegnato (arrivo)
 * li impostano le sezioni Ordini e Bolle, quindi qui non ci sono.
 */
const PASSAGGI: Record<AzioneLibro, { da: StatoLibroCliente; a: StatoLibroCliente; data: "prenotatoAt" | "ritiratoAt" }> = {
  prenota: { da: "IN_LISTA", a: "PRENOTATO", data: "prenotatoAt" },
  togli: { da: "PRENOTATO", a: "IN_LISTA", data: "prenotatoAt" },
  ritira: { da: "ASSEGNATO", a: "RITIRATO", data: "ritiratoAt" },
  annullaRitiro: { da: "RITIRATO", a: "ASSEGNATO", data: "ritiratoAt" },
};

/** Da quale stato parte l'azione, dove arriva e che data scrive (azzerata quando si torna indietro). */
export function passaggio(azione: AzioneLibro, adesso = new Date()) {
  const p = PASSAGGI[azione];
  const avanti = azione === "prenota" || azione === "ritira";
  return { da: p.da, a: p.a, dati: { stato: p.a, [p.data]: avanti ? adesso : null } };
}

/** Righe che si possono ancora modificare o eliminare: quelle non ancora ordinate al fornitore. */
export const modificabile = (stato: StatoLibroCliente) => stato === "IN_LISTA" || stato === "PRENOTATO";

type Prezzo = Prisma.Decimal | number | string;
type Riga = { prezzo: Prezzo; prezzoUsato?: Prezzo | null; stato: StatoLibroCliente };

/** Quanto paga il cliente per un libro: il prezzo della copia usata se ne ha ricevuta una, altrimenti la copertina. */
export const prezzoCliente = (r: { prezzo: Prezzo; prezzoUsato?: Prezzo | null }) => Number(r.prezzoUsato ?? r.prezzo);
const arrotonda = (n: number) => Math.round(n * 100) / 100;

/**
 * Totali della scheda come in GS_MAG: «lista» = tutti i libri della classe, «prenotati» = quelli che il
 * cliente vuole (da Prenotato in poi), «da pagare» = prenotati − acconto.
 */
export function totaliCliente(righe: Riga[], acconto: Prisma.Decimal | number | string) {
  const lista = righe.reduce((t, r) => t + Number(r.prezzo), 0);
  const prenotati = righe.filter((r) => r.stato !== "IN_LISTA").reduce((t, r) => t + prezzoCliente(r), 0);
  return {
    lista: arrotonda(lista),
    prenotati: arrotonda(prenotati),
    acconto: arrotonda(Number(acconto)),
    daPagare: arrotonda(prenotati - Number(acconto)),
  };
}

/** Importo in euro scritto a mano («20», «12,50»), da 0 a 9999. */
export function leggiImporto(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 9999 ? arrotonda(n) : null;
}

export type TestataCliente = {
  cognome: string;
  nome: string;
  telefono: string;
  scuolaId: number;
  classe: string;
  corso: string;
  acconto: number;
  note: string;
};

/** Testata della scheda cliente: cognome, nome, scuola e classe obbligatori; codice fiscale non serve. */
export function validaTestataCliente(body: any): { testata: TestataCliente } | { errore: string } {
  const testo = (k: string, max = 100) => String(body?.[k] ?? "").trim().slice(0, max);
  const cognome = testo("cognome");
  const nome = testo("nome");
  const scuolaId = Number(body?.scuolaId);
  const classe = normalizzaClasse(body?.classe);
  const acconto = leggiImporto(body?.acconto);
  if (!cognome) return { errore: "Inserire il cognome." };
  if (!nome) return { errore: "Inserire il nome." };
  if (!Number.isInteger(scuolaId) || scuolaId <= 0) return { errore: "Scegliere la scuola." };
  if (!classe || classe.length > 20) return { errore: "Scegliere la classe." };
  if (acconto === null) return { errore: "L'acconto non è un importo valido." };
  return {
    testata: {
      cognome,
      nome,
      telefono: testo("telefono", 40),
      scuolaId,
      classe,
      corso: testo("corso", 300),
      acconto,
      note: testo("note", 1000),
    },
  };
}
