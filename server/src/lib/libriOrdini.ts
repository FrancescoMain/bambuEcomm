// Regole degli ordini al fornitore (ex Schede Ordini di GS_MAG), separate dalle rotte per poterle testare.

type LibroPrenotato = { id: number; isbn: string };
type CopiaLibera = { id: number; isbn: string };

/**
 * Abbina i libri prenotati alle copie già ordinate e rimaste libere, stesso codice. I libri vanno passati
 * in ordine di prenotazione: le copie vanno ai primi che le hanno chieste (risposta 5 del negozio).
 * Restituisce le coppie e i libri che restano da ordinare.
 */
export function abbina<L extends LibroPrenotato>(libri: L[], libere: CopiaLibera[]) {
  const perCodice = new Map<string, number[]>();
  for (const c of libere) perCodice.set(c.isbn, [...(perCodice.get(c.isbn) ?? []), c.id]);
  const coppie: { rigaId: number; libroId: number }[] = [];
  const daOrdinare: L[] = [];
  for (const l of libri) {
    const rigaId = perCodice.get(l.isbn)?.shift();
    if (rigaId !== undefined) coppie.push({ rigaId, libroId: l.id });
    else daOrdinare.push(l);
  }
  return { coppie, daOrdinare };
}

type RigaLibro = { isbn: string; titolo: string; autori: string; editore: string; volume: string; prezzo: unknown };

/** Righe una per copia → una per codice con la quantità, in ordine di codice (per l'elenco e il CSV). */
export function perCodice<R extends RigaLibro>(righe: R[]) {
  const mappa = new Map<string, { isbn: string; titolo: string; autori: string; editore: string; volume: string; prezzo: number; quantita: number }>();
  for (const r of righe) {
    const g = mappa.get(r.isbn);
    if (g) g.quantita++;
    else mappa.set(r.isbn, { isbn: r.isbn, titolo: r.titolo, autori: r.autori, editore: r.editore, volume: r.volume, prezzo: Number(r.prezzo), quantita: 1 });
  }
  return [...mappa.values()].sort((a, b) => a.isbn.localeCompare(b.isbn));
}

/** CSV per il distributore come in GS_MAG: «codice;quantità», una riga per codice, niente intestazione. */
export const csvOrdine = (righe: RigaLibro[]) => perCodice(righe).map((g) => `${g.isbn};${g.quantita}\n`).join("");
