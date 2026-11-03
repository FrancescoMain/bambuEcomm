import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { validaLibro } from "../lib/libriScuole";
import { contaPerCodice, daDareDalNegozio, leggiQuantita, normalizzaIsbn } from "../lib/libriMagazzino";
import { blocca, CLIENTE, passaAlProssimo } from "../lib/libriTx";
import { datiLibri } from "../lib/libriCatalogo";

// Gestionale libri scolastici (ex GS_MAG), sezione Magazzino: i libri già in negozio senza cliente, caricati in
// anticipo (anche col lettore di codici) e corretti a mano. Dalla scheda del cliente si danno subito.
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

/** La quantità sarebbe andata sotto zero (vincolo GiacenzaLibro_quantita_check). */
const sottoZero = (e: unknown) =>
  (e instanceof Prisma.PrismaClientKnownRequestError || e instanceof Prisma.PrismaClientUnknownRequestError) &&
  String(e.message).includes("GiacenzaLibro_quantita_check");

const DATI_LIBRO = { isbn: true, materia: true, autori: true, titolo: true, volume: true, editore: true, prezzo: true } as const;

async function leggiGiacenza(isbn: string) {
  const giacenza = await prisma.giacenzaLibro.findUnique({
    where: { isbn },
    include: { movimenti: { orderBy: { id: "desc" }, take: 100 } },
  });
  if (!giacenza) return null;
  // Per «dato al cliente» e «rientro» si mostra a chi
  const libri = await prisma.schedaClienteLibro.findMany({
    where: { id: { in: giacenza.movimenti.flatMap((m) => (m.libroId ? [m.libroId] : [])) } },
    select: { id: true, ...CLIENTE },
  });
  const cliente = new Map(libri.map((l) => [l.id, l.scheda]));
  return { ...giacenza, movimenti: giacenza.movimenti.map((m) => ({ ...m, cliente: m.libroId ? cliente.get(m.libroId) ?? null : null })) };
}

// GET /api/libri/magazzino?q= — giacenze per codice, con prenotati, in ordine e da ritirare dello stesso libro
router.get("/", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  const where: Prisma.GiacenzaLibroWhereInput = q
    ? {
        OR: [
          { isbn: { startsWith: normalizzaIsbn(q) } },
          ...(["titolo", "autori", "editore", "materia"] as const).map((k) => ({ [k]: { contains: q, mode: "insensitive" as const } })),
        ],
      }
    : {};
  try {
    const giacenze = await prisma.giacenzaLibro.findMany({ where, orderBy: { isbn: "asc" }, take: 3000 });
    const codici = giacenze.map((g) => g.isbn);
    const [prenotati, inOrdine, daRitirare] = await Promise.all([
      prisma.schedaClienteLibro.findMany({ where: { isbn: { in: codici }, stato: "PRENOTATO" }, select: { isbn: true } }),
      prisma.ordineRiga.findMany({ where: { isbn: { in: codici }, arrivatoAt: null }, select: { isbn: true } }),
      prisma.schedaClienteLibro.findMany({ where: { isbn: { in: codici }, stato: "ASSEGNATO" }, select: { isbn: true } }),
    ]);
    const [p, o, r] = [contaPerCodice(prenotati), contaPerCodice(inOrdine), contaPerCodice(daRitirare)];
    res.json(
      giacenze.map((g) => ({ ...g, prenotati: p.get(g.isbn) ?? 0, inOrdine: o.get(g.isbn) ?? 0, daRitirare: r.get(g.isbn) ?? 0 }))
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero del magazzino.");
  }
});

// POST /api/libri/magazzino/carico { isbn, quantita?, …dati del libro } — carica copie in negozio (lettore: una per
// lettura). Un codice nuovo prende i dati dalle classi; se non c'è da nessuna parte servono i dati scritti a mano.
router.post("/carico", async (req: Request, res: Response) => {
  const isbn = normalizzaIsbn(req.body?.isbn);
  const quantita = req.body?.quantita === undefined ? 1 : leggiQuantita(req.body.quantita);
  if (!isbn || isbn.length > 30) {
    res.status(400).json({ message: "Inserire il codice (ISBN)." });
    return;
  }
  if (!quantita) {
    res.status(400).json({ message: "La quantità deve essere almeno 1." });
    return;
  }
  try {
    const esiste = await prisma.giacenzaLibro.findUnique({ where: { isbn }, select: { id: true } });
    let dati: Prisma.GiacenzaLibroCreateInput | null = null;
    if (!esiste) {
      if (req.body?.titolo !== undefined) {
        const v = validaLibro({ ...req.body, isbn });
        if ("errore" in v) {
          res.status(400).json({ message: v.errore });
          return;
        }
        const { nuovaAdozione: _n, daAcquistare: _a, consigliato: _c, ...libro } = v.libro;
        dati = libro;
      } else {
        dati = (await datiLibri([isbn])).get(isbn) ?? null;
        if (!dati) {
          res.status(404).json({ message: `Il codice ${isbn} non è in nessuna classe: scrivi i dati del libro.`, daCompilare: true });
          return;
        }
      }
    }
    await prisma.$transaction(async (tx) => {
      const aggiungi = { quantita: { increment: quantita } };
      // Codice nuovo: upsert, perché un'altra postazione potrebbe averlo appena caricato
      const g = dati
        ? await tx.giacenzaLibro.upsert({ where: { isbn }, create: { ...dati, isbn, quantita }, update: aggiungi, select: { id: true } })
        : await tx.giacenzaLibro.update({ where: { isbn }, data: aggiungi, select: { id: true } });
      await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta: quantita, causale: "CARICO" } });
    });
    res.status(esiste ? 200 : 201).json(await leggiGiacenza(isbn));
  } catch (e) {
    errore(res, e, "Non è stato possibile caricare il libro.");
  }
});

// POST /api/libri/magazzino/dai { libroId } — il libro del cliente si prende dal negozio: diventa «Assegnato».
// Se era già ordinato («Confermato») la copia in ordine passa al primo che aspetta lo stesso libro.
router.post("/dai", async (req: Request, res: Response) => {
  const libroId = id(req.body?.libroId);
  if (!libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    const esito = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const libro = await tx.schedaClienteLibro.findUnique({ where: { id: libroId }, select: { stato: true, isbn: true, prenotatoAt: true } });
      if (!libro || !daDareDalNegozio(libro.stato)) return { errore: "Il libro non si può più dare dal negozio: ricarica la scheda." };
      const { count } = await tx.giacenzaLibro.updateMany({ where: { isbn: libro.isbn, quantita: { gte: 1 } }, data: { quantita: { decrement: 1 } } });
      if (!count) return { errore: "Non ci sono più copie di questo libro in negozio." };
      const g = await tx.giacenzaLibro.findUniqueOrThrow({ where: { isbn: libro.isbn }, select: { id: true } });
      await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta: -1, causale: "DATO_AL_CLIENTE", libroId } });

      let passatoA = null;
      let ordine = null;
      if (libro.stato === "CONFERMATO") {
        const riga = await tx.ordineRiga.findUnique({
          where: { libroId },
          select: { id: true, isbn: true, ordine: { select: { anno: true, numero: true } } },
        });
        if (riga) {
          await tx.ordineRiga.update({ where: { id: riga.id }, data: { libroId: null } });
          passatoA = await passaAlProssimo(tx, riga);
          ordine = riga.ordine;
        }
      }
      const adesso = new Date();
      await tx.schedaClienteLibro.update({
        where: { id: libroId },
        data: { stato: "ASSEGNATO", prenotatoAt: libro.prenotatoAt ?? adesso, confermatoAt: null, assegnatoAt: adesso, dalNegozioAt: adesso },
      });
      return { passatoA, ordine };
    });
    if ("errore" in esito) res.status(409).json({ message: esito.errore });
    else res.json(esito);
  } catch (e) {
    errore(res, e, "Non è stato possibile dare il libro dal negozio.");
  }
});

// POST /api/libri/magazzino/rimetti { libroId } — il libro dato dal negozio torna in negozio e il cliente torna
// «Prenotato» (dato per sbaglio, o il cliente non lo vuole più da subito)
router.post("/rimetti", async (req: Request, res: Response) => {
  const libroId = id(req.body?.libroId);
  if (!libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    const rimesso = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const libro = await tx.schedaClienteLibro.findFirst({
        where: { id: libroId, stato: "ASSEGNATO", dalNegozioAt: { not: null } },
        select: DATI_LIBRO,
      });
      if (!libro) return false;
      await tx.schedaClienteLibro.update({ where: { id: libroId }, data: { stato: "PRENOTATO", assegnatoAt: null, dalNegozioAt: null } });
      // Se nel frattempo la riga del magazzino è stata eliminata, si ricrea con i dati del libro
      const g = await tx.giacenzaLibro.upsert({
        where: { isbn: libro.isbn },
        create: { ...libro, quantita: 1 },
        update: { quantita: { increment: 1 } },
        select: { id: true },
      });
      await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta: 1, causale: "RIENTRO", libroId } });
      return true;
    });
    if (!rimesso) res.status(409).json({ message: "Il libro non è più tra quelli dati dal negozio: ricarica la scheda." });
    else res.json({ ok: true });
  } catch (e) {
    errore(res, e, "Non è stato possibile rimettere il libro in negozio.");
  }
});

// GET /api/libri/magazzino/:isbn — la giacenza con gli ultimi movimenti
router.get("/:isbn", async (req: Request, res: Response) => {
  try {
    const giacenza = await leggiGiacenza(normalizzaIsbn(req.params.isbn));
    if (!giacenza) res.status(404).json({ message: "Libro non presente in magazzino." });
    else res.json(giacenza);
  } catch (e) {
    errore(res, e, "Errore nel recupero del libro.");
  }
});

// PUT /api/libri/magazzino/:isbn { dati del libro, quantita } — correzione a mano: dati e quantità contata
router.put("/:isbn", async (req: Request, res: Response) => {
  const isbn = normalizzaIsbn(req.params.isbn);
  const v = validaLibro({ ...req.body, isbn });
  const quantita = leggiQuantita(req.body?.quantita);
  if ("errore" in v) {
    res.status(400).json({ message: v.errore });
    return;
  }
  if (quantita === null) {
    res.status(400).json({ message: "La quantità è un numero intero da 0 a 9999." });
    return;
  }
  const { nuovaAdozione: _n, daAcquistare: _a, consigliato: _c, isbn: _i, ...dati } = v.libro;
  try {
    const trovato = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const prima = await tx.giacenzaLibro.findUnique({ where: { isbn }, select: { id: true, quantita: true } });
      if (!prima) return false;
      await tx.giacenzaLibro.update({ where: { isbn }, data: { ...dati, quantita } });
      if (quantita !== prima.quantita) {
        await tx.movimentoGiacenza.create({ data: { giacenzaId: prima.id, delta: quantita - prima.quantita, causale: "RETTIFICA" } });
      }
      return true;
    });
    if (!trovato) res.status(404).json({ message: "Libro non presente in magazzino." });
    else res.json(await leggiGiacenza(isbn));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare il libro.");
  }
});

// POST /api/libri/magazzino/:isbn/rettifica { delta } — il «−» della tabella (o una correzione di più copie)
router.post("/:isbn/rettifica", async (req: Request, res: Response) => {
  const isbn = normalizzaIsbn(req.params.isbn);
  const delta = Number(req.body?.delta);
  if (!Number.isInteger(delta) || !delta || Math.abs(delta) > 9999) {
    res.status(400).json({ message: "Correzione non valida." });
    return;
  }
  try {
    const trovato = await prisma.$transaction(async (tx) => {
      const g = await tx.giacenzaLibro.findUnique({ where: { isbn }, select: { id: true } });
      if (!g) return false;
      await tx.giacenzaLibro.update({ where: { isbn }, data: { quantita: { increment: delta } } });
      await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta, causale: "RETTIFICA" } });
      return true;
    });
    if (!trovato) res.status(404).json({ message: "Libro non presente in magazzino." });
    else res.json(await leggiGiacenza(isbn));
  } catch (e) {
    if (sottoZero(e)) res.status(409).json({ message: "In negozio non ci sono abbastanza copie da togliere." });
    else errore(res, e, "Non è stato possibile correggere la quantità.");
  }
});

// DELETE /api/libri/magazzino/:isbn — solo a quantità zero (i movimenti se ne vanno con la riga)
router.delete("/:isbn", async (req: Request, res: Response) => {
  const isbn = normalizzaIsbn(req.params.isbn);
  try {
    const g = await prisma.giacenzaLibro.findUnique({ where: { isbn }, select: { quantita: true } });
    if (g && g.quantita > 0) {
      res.status(409).json({ message: "In negozio ci sono ancora copie: porta la quantità a zero prima di eliminarlo." });
      return;
    }
    await prisma.giacenzaLibro.deleteMany({ where: { isbn, quantita: 0 } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare il libro.");
  }
});

export default router;
