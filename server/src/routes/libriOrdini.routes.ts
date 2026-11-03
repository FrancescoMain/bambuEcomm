import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { barcodeScheda } from "../lib/libriClienti";
import { abbina, leggiCopieNegozio, perCodice } from "../lib/libriOrdini";
import { datiLibri } from "../lib/libriCatalogo";
import { blocca, Cambiati, CLIENTE, conferma, passaAlProssimo } from "../lib/libriTx";

// Gestionale libri scolastici (ex GS_MAG), sezione Ordini: i libri prenotati dai clienti si ordinano al fornitore
// e diventano «Confermato». Ogni riga d'ordine è una copia, legata al libro del cliente che la aspetta.
const router = Router();
router.use(authenticateToken, authorizeRole(["SCUOLE"]), noStore);

const id = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

function errore(res: Response, e: unknown, messaggio: string) {
  console.error(messaggio, e);
  res.status(500).json({ message: messaggio });
}

const CAMPI_LIBRO = { isbn: true, materia: true, autori: true, titolo: true, volume: true, editore: true, prezzo: true } as const;
const copieLibere = { libroId: null, arrivatoAt: null } satisfies Prisma.OrdineRigaWhereInput;

/** Codici per il negozio che il gestionale non ha mai visto: i dati del libro vanno scritti prima altrove. */
class Sconosciuti extends Error {
  constructor(readonly codici: string[]) {
    super();
  }
}

/**
 * Righe d'ordine per il negozio: una per copia, senza cliente («libere»), con i dati del libro presi dalle classi,
 * dalle schede o dal magazzino. All'arrivo vanno al primo che ha prenotato lo stesso libro, altrimenti in magazzino.
 */
async function righeNegozio(tx: Prisma.TransactionClient, copie: { isbn: string; quantita: number }[], ordineId: number) {
  const dati = await datiLibri(copie.map((c) => c.isbn), tx);
  const sconosciuti = copie.filter((c) => !dati.has(c.isbn)).map((c) => c.isbn);
  if (sconosciuti.length) throw new Sconosciuti(sconosciuti);
  return copie.flatMap((c) => Array.from({ length: c.quantita }, () => ({ ...dati.get(c.isbn)!, ordineId, libroId: null })));
}

const messaggioSconosciuti = (e: Sconosciuti) =>
  `${e.codici.length === 1 ? "Il codice" : "I codici"} ${e.codici.join(", ")} non ${e.codici.length === 1 ? "è" : "sono"} in nessuna classe, scheda o magazzino: aggiungi prima il libro in Magazzino.`;

async function leggiOrdine(ordineId: number) {
  const ordine = await prisma.ordineFornitore.findUnique({
    where: { id: ordineId },
    include: { righe: { orderBy: [{ isbn: "asc" }, { id: "asc" }], include: { libro: { select: { id: true, stato: true, ...CLIENTE } } } } },
  });
  if (!ordine) return null;
  const totale = Math.round(ordine.righe.reduce((t, r) => t + Number(r.prezzo), 0) * 100) / 100;
  return { ...ordine, barcode: barcodeScheda(ordine.anno, ordine.numero), totale };
}

// GET /api/libri/ordini/da-ordinare — i libri prenotati non ancora ordinati, per codice, meno le copie libere
router.get("/da-ordinare", async (_req: Request, res: Response) => {
  try {
    const [prenotati, libere, inNegozio] = await Promise.all([
      prisma.schedaClienteLibro.findMany({ where: { stato: "PRENOTATO" }, select: CAMPI_LIBRO }),
      prisma.ordineRiga.findMany({ where: copieLibere, select: { isbn: true } }),
      prisma.giacenzaLibro.findMany({ where: { quantita: { gt: 0 } }, select: { isbn: true, quantita: true } }),
    ]);
    const nLibere = new Map<string, number>();
    for (const c of libere) nLibere.set(c.isbn, (nLibere.get(c.isbn) ?? 0) + 1);
    const nNegozio = new Map(inNegozio.map((g) => [g.isbn, g.quantita]));
    res.json(
      perCodice(prenotati).map(({ quantita, ...g }) => {
        const giaInOrdine = Math.min(quantita, nLibere.get(g.isbn) ?? 0);
        // Copie già in negozio: si danno dalla scheda del cliente invece di ordinarle
        return { ...g, prenotati: quantita, giaInOrdine, daOrdinare: quantita - giaInOrdine, inNegozio: nNegozio.get(g.isbn) ?? 0 };
      })
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero dei libri da ordinare.");
  }
});

// GET /api/libri/ordini/in-ordine — tutte le copie ordinate e non ancora arrivate, di tutti gli ordini
router.get("/in-ordine", async (_req: Request, res: Response) => {
  try {
    const righe = await prisma.ordineRiga.findMany({
      where: { arrivatoAt: null },
      orderBy: [{ isbn: "asc" }, { id: "asc" }],
      include: { ordine: { select: { id: true, anno: true, numero: true, data: true } }, libro: { select: { id: true, ...CLIENTE } } },
    });
    res.json(righe);
  } catch (e) {
    errore(res, e, "Errore nel recupero dei libri in ordine.");
  }
});

// POST /api/libri/ordini { isbn?: string[], negozio?: [{ isbn, quantita }] } — ordina i prenotati (tutti, o solo i
// codici scelti). Prima li abbina alle copie libere già in ordine, poi crea l'ordine con il resto, che diventa
// «Confermato», più le copie per il negozio (senza cliente, una per riga).
router.post("/", async (req: Request, res: Response) => {
  const codici = Array.isArray(req.body?.isbn) ? req.body.isbn.map((c: unknown) => String(c).trim()).filter(Boolean) : null;
  const negozio = leggiCopieNegozio(req.body?.negozio);
  if (!negozio) {
    res.status(400).json({ message: "Copie per il negozio non valide (da 1 a 99 per libro)." });
    return;
  }
  if (codici && ((!codici.length && !negozio.length) || codici.length > 2000)) {
    res.status(400).json({ message: "Nessun libro scelto." });
    return;
  }
  const note = String(req.body?.note ?? "").trim().slice(0, 1000);
  try {
    const esito = await prisma.$transaction(
      async (tx) => {
        await blocca(tx);
        const adesso = new Date();
        const prenotati = await tx.schedaClienteLibro.findMany({
          where: { stato: "PRENOTATO", ...(codici ? { isbn: { in: codici } } : {}) },
          orderBy: [{ prenotatoAt: "asc" }, { id: "asc" }],
          select: { id: true, ...CAMPI_LIBRO },
        });
        const libere = await tx.ordineRiga.findMany({
          where: { ...copieLibere, isbn: { in: [...new Set(prenotati.map((l) => l.isbn))] } },
          orderBy: { id: "asc" },
          select: { id: true, isbn: true },
        });
        const { coppie, daOrdinare } = abbina(prenotati, libere);
        await conferma(tx, prenotati.map((l) => l.id), adesso);
        for (const c of coppie) await tx.ordineRiga.update({ where: { id: c.rigaId }, data: { libroId: c.libroId } });
        if (!daOrdinare.length && !negozio.length) return { ordineId: null, abbinati: coppie.length, ordinati: 0, perNegozio: 0 };

        const anno = adesso.getFullYear();
        const ultimo = await tx.ordineFornitore.aggregate({ where: { anno }, _max: { numero: true } });
        const ordine = await tx.ordineFornitore.create({ data: { anno, numero: (ultimo._max.numero ?? 0) + 1, data: adesso, note } });
        const perNegozio = await righeNegozio(tx, negozio, ordine.id);
        await tx.ordineRiga.createMany({
          data: [...daOrdinare.map(({ id: libroId, ...l }) => ({ ...l, libroId, ordineId: ordine.id })), ...perNegozio],
        });
        return { ordineId: ordine.id, abbinati: coppie.length, ordinati: daOrdinare.length, perNegozio: perNegozio.length };
      },
      { timeout: 30_000 }
    );
    if (!esito.abbinati && !esito.ordinati && !esito.perNegozio) {
      res.status(409).json({ message: "Non ci sono libri prenotati da ordinare." });
      return;
    }
    res.status(esito.ordineId ? 201 : 200).json({ ...esito, ordine: esito.ordineId ? await leggiOrdine(esito.ordineId) : null });
  } catch (e) {
    if (e instanceof Cambiati) res.status(409).json({ message: "Un'altra postazione ha cambiato i libri prenotati: riprova." });
    else if (e instanceof Sconosciuti) res.status(400).json({ message: messaggioSconosciuti(e) });
    else errore(res, e, "Non è stato possibile creare l'ordine.");
  }
});

// POST /api/libri/ordini/annulla-libro { libroId } — il cliente non vuole più un libro già ordinato («Confermato»):
// torna «in lista» e la copia passa al primo che aspetta lo stesso libro, altrimenti resta libera nell'ordine.
router.post("/annulla-libro", async (req: Request, res: Response) => {
  const libroId = id(req.body?.libroId);
  if (!libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    const esito = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const { count } = await tx.schedaClienteLibro.updateMany({
        where: { id: libroId, stato: "CONFERMATO" },
        data: { stato: "IN_LISTA", prenotatoAt: null, confermatoAt: null },
      });
      if (!count) return null;
      const riga = await tx.ordineRiga.findUnique({
        where: { libroId },
        select: { id: true, isbn: true, ordine: { select: { anno: true, numero: true } } },
      });
      if (!riga) return { passatoA: null, ordine: null };
      await tx.ordineRiga.update({ where: { id: riga.id }, data: { libroId: null } });
      return { passatoA: await passaAlProssimo(tx, riga), ordine: riga.ordine };
    });
    if (!esito) {
      res.status(409).json({ message: "Il libro non è più «Confermato»: ricarica la scheda." });
      return;
    }
    res.json(esito);
  } catch (e) {
    errore(res, e, "Non è stato possibile annullare il libro.");
  }
});

// GET /api/libri/ordini?anno= — elenco degli ordini con copie, arrivate e totale
router.get("/", async (req: Request, res: Response) => {
  const anno = Number(req.query.anno);
  try {
    const ordini = await prisma.ordineFornitore.findMany({
      where: Number.isInteger(anno) && anno > 0 ? { anno } : {},
      orderBy: [{ anno: "desc" }, { numero: "desc" }],
      take: 300,
      include: { righe: { select: { prezzo: true, arrivatoAt: true, libroId: true } } },
    });
    res.json(
      ordini.map(({ righe, ...o }) => ({
        ...o,
        barcode: barcodeScheda(o.anno, o.numero),
        copie: righe.length,
        arrivate: righe.filter((r) => r.arrivatoAt).length,
        libere: righe.filter((r) => !r.libroId && !r.arrivatoAt).length,
        totale: Math.round(righe.reduce((t, r) => t + Number(r.prezzo), 0) * 100) / 100,
      }))
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero degli ordini.");
  }
});

// GET /api/libri/ordini/:id
router.get("/:id", async (req: Request, res: Response) => {
  const ordineId = id(req.params.id);
  if (!ordineId) {
    res.status(400).json({ message: "Ordine non valido." });
    return;
  }
  try {
    const ordine = await leggiOrdine(ordineId);
    if (!ordine) res.status(404).json({ message: "Ordine non trovato." });
    else res.json(ordine);
  } catch (e) {
    errore(res, e, "Errore nel recupero dell'ordine.");
  }
});

// PATCH /api/libri/ordini/:id { note } — appunti sull'ordine (es. a chi è stato mandato)
router.patch("/:id", async (req: Request, res: Response) => {
  const ordineId = id(req.params.id);
  if (!ordineId) {
    res.status(400).json({ message: "Ordine non valido." });
    return;
  }
  try {
    await prisma.ordineFornitore.update({ where: { id: ordineId }, data: { note: String(req.body?.note ?? "").trim().slice(0, 1000) } });
    res.json(await leggiOrdine(ordineId));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare l'ordine.");
  }
});

// POST /api/libri/ordini/:id/negozio { isbn, quantita } — copie per il negozio aggiunte a un ordine già fatto
router.post("/:id/negozio", async (req: Request, res: Response) => {
  const ordineId = id(req.params.id);
  const copie = leggiCopieNegozio([{ isbn: req.body?.isbn, quantita: req.body?.quantita ?? 1 }]);
  if (!ordineId || !copie) {
    res.status(400).json({ message: !ordineId ? "Ordine non valido." : "Scrivi il codice e da 1 a 99 copie." });
    return;
  }
  try {
    const trovato = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      if (!(await tx.ordineFornitore.findUnique({ where: { id: ordineId }, select: { id: true } }))) return false;
      await tx.ordineRiga.createMany({ data: await righeNegozio(tx, copie, ordineId) });
      return true;
    });
    if (!trovato) res.status(404).json({ message: "Ordine non trovato." });
    else res.status(201).json(await leggiOrdine(ordineId));
  } catch (e) {
    if (e instanceof Sconosciuti) res.status(400).json({ message: messaggioSconosciuti(e) });
    else errore(res, e, "Non è stato possibile aggiungere le copie per il negozio.");
  }
});

// DELETE /api/libri/ordini/:id/righe/:rigaId — togli una copia non ancora arrivata: il libro torna «Prenotato»
router.delete("/:id/righe/:rigaId", async (req: Request, res: Response) => {
  const ordineId = id(req.params.id);
  const rigaId = id(req.params.rigaId);
  if (!ordineId || !rigaId) {
    res.status(400).json({ message: "Riga non valida." });
    return;
  }
  try {
    const tolta = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const riga = await tx.ordineRiga.findFirst({ where: { id: rigaId, ordineId }, select: { libroId: true, arrivatoAt: true } });
      if (!riga) return true;
      if (riga.arrivatoAt) return false;
      if (riga.libroId) {
        await tx.schedaClienteLibro.updateMany({ where: { id: riga.libroId, stato: "CONFERMATO" }, data: { stato: "PRENOTATO", confermatoAt: null } });
      }
      await tx.ordineRiga.delete({ where: { id: rigaId } });
      return true;
    });
    if (!tolta) res.status(409).json({ message: "La copia è già arrivata: non si può togliere dall'ordine." });
    else res.json(await leggiOrdine(ordineId));
  } catch (e) {
    errore(res, e, "Non è stato possibile togliere la copia dall'ordine.");
  }
});

// DELETE /api/libri/ordini/:id — solo se non è arrivato niente: i libri tornano «Prenotato»
router.delete("/:id", async (req: Request, res: Response) => {
  const ordineId = id(req.params.id);
  if (!ordineId) {
    res.status(400).json({ message: "Ordine non valido." });
    return;
  }
  try {
    const eliminato = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const righe = await tx.ordineRiga.findMany({ where: { ordineId }, select: { libroId: true, arrivatoAt: true } });
      if (righe.some((r) => r.arrivatoAt)) return false;
      const libri = righe.flatMap((r) => (r.libroId ? [r.libroId] : []));
      await tx.schedaClienteLibro.updateMany({ where: { id: { in: libri }, stato: "CONFERMATO" }, data: { stato: "PRENOTATO", confermatoAt: null } });
      await tx.ordineFornitore.deleteMany({ where: { id: ordineId } });
      return true;
    });
    if (!eliminato) res.status(409).json({ message: "Sono già arrivate copie di questo ordine: non si può eliminare." });
    else res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare l'ordine.");
  }
});

export default router;
