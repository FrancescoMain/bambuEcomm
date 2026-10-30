import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { validaLibro } from "../lib/libriScuole";
import {
  AZIONI,
  barcodeScheda,
  leggiBarcode,
  leggiImporto,
  modificabile,
  passaggio,
  totaliCliente,
  validaTestataCliente,
  type AzioneLibro,
} from "../lib/libriClienti";

// Gestionale libri scolastici (ex GS_MAG), sezione Clienti: schede di prenotazione dei libri degli alunni.
const router = Router();
router.use(authenticateToken, authorizeRole(["SCUOLE"]), noStore);

const id = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const giaInserita = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

function errore(res: Response, e: unknown, messaggio: string) {
  console.error(messaggio, e);
  res.status(500).json({ message: messaggio });
}

const CAMPI_LIBRO = {
  isbn: true,
  materia: true,
  autori: true,
  titolo: true,
  volume: true,
  editore: true,
  prezzo: true,
  nuovaAdozione: true,
  daAcquistare: true,
  consigliato: true,
} as const;

/** Copia nella scheda i libri della classe (stessa scuola, anno e classe) che non ci sono ancora, «in lista». */
async function importaDallaClasse(
  tx: Prisma.TransactionClient,
  scheda: { id: number; scuolaId: number; anno: number; classe: string }
) {
  const classe = await tx.schedaScuola.findFirst({
    where: { scuolaId: scheda.scuolaId, anno: scheda.anno, classe: scheda.classe },
    orderBy: { id: "asc" },
    select: { libri: { select: CAMPI_LIBRO } },
  });
  if (!classe) return { classeTrovata: false, libriAggiunti: 0 };
  const { count } = await tx.schedaClienteLibro.createMany({
    data: classe.libri.map((l) => ({ ...l, schedaId: scheda.id })),
    skipDuplicates: true,
  });
  return { classeTrovata: true, libriAggiunti: count };
}

async function leggiScheda(schedaId: number) {
  const scheda = await prisma.schedaCliente.findUnique({
    where: { id: schedaId },
    include: {
      scuola: { select: { id: true, codice: true, nome: true, citta: true } },
      libri: { orderBy: { isbn: "asc" } },
    },
  });
  if (!scheda) return null;
  return { ...scheda, barcode: barcodeScheda(scheda.anno, scheda.numero), totali: totaliCliente(scheda.libri, scheda.acconto) };
}

async function rispondiScheda(res: Response, schedaId: number, stato = 200) {
  const scheda = await leggiScheda(schedaId);
  if (!scheda) res.status(404).json({ message: "Scheda non trovata." });
  else res.status(stato).json(scheda);
}

// ── Schede ───────────────────────────────────────────────────────────────

// GET /api/libri/clienti?anno=&scuolaId=&classe=&q= — elenco con i conteggi per stato e i totali.
// q: barcode letto con lo scanner, numero di scheda, oppure cognome/nome/telefono.
router.get("/", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  const barcode = leggiBarcode(q);
  const where: Prisma.SchedaClienteWhereInput = {};
  if (barcode) Object.assign(where, barcode);
  else {
    const anno = Number(req.query.anno);
    if (Number.isInteger(anno) && anno > 0) where.anno = anno;
    const scuolaId = id(req.query.scuolaId);
    if (scuolaId) where.scuolaId = scuolaId;
    const classe = String(req.query.classe ?? "").trim();
    if (classe) where.classe = classe;
    if (/^\d{1,6}$/.test(q)) where.OR = [{ numero: Number(q) }, { telefono: { contains: q } }];
    else if (q) {
      const parole = q.split(/\s+/).slice(0, 4);
      where.AND = parole.map((p) => ({
        OR: [
          { cognome: { contains: p, mode: "insensitive" as const } },
          { nome: { contains: p, mode: "insensitive" as const } },
          { telefono: { contains: p } },
        ],
      }));
    }
  }
  try {
    const schede = await prisma.schedaCliente.findMany({
      where,
      orderBy: [{ anno: "desc" }, { numero: "desc" }],
      take: 300,
      include: {
        scuola: { select: { nome: true } },
        libri: { select: { prezzo: true, stato: true } },
      },
    });
    res.json(
      schede.map(({ libri, ...s }) => {
        const conteggi = { IN_LISTA: 0, PRENOTATO: 0, CONFERMATO: 0, ASSEGNATO: 0, RITIRATO: 0 };
        for (const l of libri) conteggi[l.stato]++;
        return { ...s, barcode: barcodeScheda(s.anno, s.numero), conteggi, totali: totaliCliente(libri, s.acconto) };
      })
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero delle schede.");
  }
});

// POST /api/libri/clienti — nuova scheda: numero = ultimo dell'anno + 1, poi i libri della classe «in lista»
router.post("/", async (req: Request, res: Response) => {
  const v = validaTestataCliente(req.body);
  if ("errore" in v) {
    res.status(400).json({ message: v.errore });
    return;
  }
  const anno = Number(req.body?.anno) || new Date().getFullYear();
  if (anno < 2000 || anno > 2100) {
    res.status(400).json({ message: "Anno non valido." });
    return;
  }
  // Tre postazioni lavorano insieme: il lock per anno assegna i numeri uno alla volta; il vincolo unico
  // con i tentativi resta come rete di sicurezza.
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    try {
      const creata = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('scheda_cliente_numero'), ${anno}::int)`;
        const ultimo = await tx.schedaCliente.aggregate({ where: { anno }, _max: { numero: true } });
        const scheda = await tx.schedaCliente.create({
          data: { ...v.testata, anno, numero: (ultimo._max.numero ?? 0) + 1 },
        });
        const esito = await importaDallaClasse(tx, scheda);
        return { scheda, esito };
      });
      const scheda = await leggiScheda(creata.scheda.id);
      res.status(201).json({ ...scheda, importazione: creata.esito });
      return;
    } catch (e) {
      if (giaInserita(e)) continue;
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        res.status(400).json({ message: "La scuola scelta non esiste più." });
        return;
      }
      errore(res, e, "Non è stato possibile creare la scheda.");
      return;
    }
  }
  res.status(503).json({ message: "Troppe schede create nello stesso momento, riprova." });
});

// GET /api/libri/clienti/:id
router.get("/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Scheda non valida." });
    return;
  }
  try {
    await rispondiScheda(res, schedaId);
  } catch (e) {
    errore(res, e, "Errore nel recupero della scheda.");
  }
});

// PUT /api/libri/clienti/:id — dati del cliente, scuola, classe, acconto. Numero e anno non cambiano.
router.put("/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const v = validaTestataCliente(req.body);
  if (!schedaId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Scheda non valida." });
    return;
  }
  try {
    await prisma.schedaCliente.update({ where: { id: schedaId }, data: v.testata });
    await rispondiScheda(res, schedaId);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      res.status(404).json({ message: "Scheda non trovata." });
    } else errore(res, e, "Non è stato possibile salvare la scheda.");
  }
});

// PATCH /api/libri/clienti/:id { acconto?, note? } — acconto (anche alla fine) e appunti, scritti nella scheda
router.patch("/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Scheda non valida." });
    return;
  }
  const data: Prisma.SchedaClienteUpdateInput = {};
  if (req.body?.acconto !== undefined) {
    const acconto = leggiImporto(req.body.acconto);
    if (acconto === null) {
      res.status(400).json({ message: "L'acconto non è un importo valido." });
      return;
    }
    data.acconto = acconto;
  }
  if (req.body?.note !== undefined) data.note = String(req.body.note).trim().slice(0, 1000);
  try {
    await prisma.schedaCliente.update({ where: { id: schedaId }, data });
    await rispondiScheda(res, schedaId);
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare la scheda.");
  }
});

// DELETE /api/libri/clienti/:id — solo se nessun libro è già stato ordinato al fornitore
router.delete("/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Scheda non valida." });
    return;
  }
  try {
    const ordinati = await prisma.schedaClienteLibro.count({
      where: { schedaId, stato: { in: ["CONFERMATO", "ASSEGNATO", "RITIRATO"] } },
    });
    if (ordinati) {
      res.status(409).json({ message: "La scheda ha libri già ordinati al fornitore: non si può eliminare." });
      return;
    }
    await prisma.schedaCliente.delete({ where: { id: schedaId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare la scheda.");
  }
});

// POST /api/libri/clienti/:id/importa — riporta i libri della classe che mancano (es. lista aggiornata)
router.post("/:id/importa", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Scheda non valida." });
    return;
  }
  try {
    const scheda = await prisma.schedaCliente.findUnique({ where: { id: schedaId } });
    if (!scheda) {
      res.status(404).json({ message: "Scheda non trovata." });
      return;
    }
    const esito = await prisma.$transaction((tx) => importaDallaClasse(tx, scheda));
    if (!esito.classeTrovata) {
      res.status(404).json({ message: `La classe ${scheda.classe} del ${scheda.anno} non ha ancora la lista dei libri.` });
      return;
    }
    res.json({ ...(await leggiScheda(schedaId)), importazione: esito });
  } catch (e) {
    errore(res, e, "Non è stato possibile importare i libri della classe.");
  }
});

// ── Libri della scheda ───────────────────────────────────────────────────

// POST /api/libri/clienti/:id/libri — libro aggiunto a mano: lo vuole il cliente, quindi è già prenotato
router.post("/:id/libri", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const v = validaLibro(req.body);
  if (!schedaId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Scheda non valida." });
    return;
  }
  try {
    await prisma.schedaClienteLibro.create({
      data: { schedaId, ...v.libro, stato: "PRENOTATO", prenotatoAt: new Date() },
    });
    await rispondiScheda(res, schedaId, 201);
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `Codice ${v.libro.isbn} già inserito in questa scheda.` });
    else errore(res, e, "Non è stato possibile aggiungere il libro.");
  }
});

// PUT /api/libri/clienti/:id/libri/:libroId — solo libri non ancora ordinati
router.put("/:id/libri/:libroId", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const libroId = id(req.params.libroId);
  const v = validaLibro(req.body);
  if (!schedaId || !libroId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Libro non valido." });
    return;
  }
  try {
    const { count } = await prisma.schedaClienteLibro.updateMany({
      where: { id: libroId, schedaId, stato: { in: ["IN_LISTA", "PRENOTATO"] } },
      data: v.libro,
    });
    if (!count) {
      res.status(409).json({ message: "Il libro è già stato ordinato al fornitore: non si può modificare." });
      return;
    }
    await rispondiScheda(res, schedaId);
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `Codice ${v.libro.isbn} già inserito in questa scheda.` });
    else errore(res, e, "Non è stato possibile salvare il libro.");
  }
});

// DELETE /api/libri/clienti/:id/libri/:libroId — solo libri non ancora ordinati
router.delete("/:id/libri/:libroId", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const libroId = id(req.params.libroId);
  if (!schedaId || !libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    const libro = await prisma.schedaClienteLibro.findFirst({ where: { id: libroId, schedaId }, select: { stato: true } });
    if (!libro) {
      res.status(204).end();
      return;
    }
    if (!modificabile(libro.stato)) {
      res.status(409).json({ message: "Il libro è già stato ordinato al fornitore: non si può eliminare." });
      return;
    }
    await prisma.schedaClienteLibro.deleteMany({ where: { id: libroId, schedaId, stato: { in: ["IN_LISTA", "PRENOTATO"] } } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare il libro.");
  }
});

// POST /api/libri/clienti/:id/stato { azione, libri: [id] } — prenota/togli/ritira/annulla ritiro, anche più libri.
// Cambia solo i libri che sono davvero nello stato di partenza (con tre postazioni insieme non si pestano i piedi).
router.post("/:id/stato", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const azione = req.body?.azione as AzioneLibro;
  const libri = Array.isArray(req.body?.libri) ? req.body.libri.map(id).filter((n: number | null): n is number => !!n) : [];
  if (!schedaId || !AZIONI.includes(azione) || !libri.length || libri.length > 200) {
    res.status(400).json({ message: "Richiesta non valida." });
    return;
  }
  try {
    const p = passaggio(azione);
    const { count } = await prisma.schedaClienteLibro.updateMany({
      where: { id: { in: libri }, schedaId, stato: p.da },
      data: p.dati,
    });
    const scheda = await leggiScheda(schedaId);
    if (!scheda) {
      res.status(404).json({ message: "Scheda non trovata." });
      return;
    }
    res.json({ ...scheda, cambiati: count });
  } catch (e) {
    errore(res, e, "Non è stato possibile cambiare lo stato.");
  }
});

export default router;
