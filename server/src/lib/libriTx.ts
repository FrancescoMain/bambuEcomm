import { Prisma } from "@prisma/client";

// Passaggi del gestionale libri che toccano più tabelle insieme (Ordini e Magazzino), dentro una transazione.

/** Un'altra postazione ha cambiato i libri mentre si lavorava: si annulla tutto e si riprova. */
export class Cambiati extends Error {}

/**
 * Ordini, abbinamenti delle copie e giacenza passano uno alla volta (tre postazioni insieme): così un libro non
 * finisce in due ordini, i numeri d'ordine non si ripetono e l'ultima copia in negozio non va a due clienti.
 */
export const blocca = (tx: Prisma.TransactionClient) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ordini_libri'))`;

export const CLIENTE = { scheda: { select: { id: true, anno: true, numero: true, cognome: true, nome: true } } } as const;

/** Libri da Prenotato a Confermato; se uno nel frattempo non è più prenotato si annulla tutto. */
export async function conferma(tx: Prisma.TransactionClient, libri: number[], adesso: Date) {
  if (!libri.length) return;
  const { count } = await tx.schedaClienteLibro.updateMany({
    where: { id: { in: libri }, stato: "PRENOTATO" },
    data: { stato: "CONFERMATO", confermatoAt: adesso },
  });
  if (count !== libri.length) throw new Cambiati();
}

/** La copia libera va al primo cliente che aspetta lo stesso libro; restituisce chi è, o null se resta libera. */
export async function passaAlProssimo(tx: Prisma.TransactionClient, riga: { id: number; isbn: string }) {
  const prossimo = await tx.schedaClienteLibro.findFirst({
    where: { isbn: riga.isbn, stato: "PRENOTATO" },
    orderBy: [{ prenotatoAt: "asc" }, { id: "asc" }],
    select: { id: true, ...CLIENTE },
  });
  if (!prossimo) return null;
  await conferma(tx, [prossimo.id], new Date());
  await tx.ordineRiga.update({ where: { id: riga.id }, data: { libroId: prossimo.id } });
  return prossimo.scheda;
}
