// Regole delle bolle di arrivo (ex Schede Bolle di GS_MAG), separate dalle rotte per poterle testare.

type CopiaInOrdine = { id: number; libroId: number | null; prenotatoAt: Date | null };

/**
 * Quale copia in ordine (stesso codice, non ancora arrivata) evade il libro appena letto: prima quelle dei clienti,
 * a chi ha prenotato per primo (risposta 5 del negozio); poi quelle senza cliente, dalla più vecchia.
 */
export function scegliCopia<C extends CopiaInOrdine>(copie: C[]): C | null {
  const tempo = (c: C) => c.prenotatoAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const deiClienti = copie.filter((c) => c.libroId !== null).sort((a, b) => tempo(a) - tempo(b) || a.libroId! - b.libroId!);
  if (deiClienti.length) return deiClienti[0];
  return [...copie].sort((a, b) => a.id - b.id)[0] ?? null;
}
