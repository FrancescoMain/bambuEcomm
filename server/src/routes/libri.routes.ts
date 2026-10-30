import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { cercaScuolaMiur, libriAdottatiMiur, normalizzaCodiceScuola } from "../lib/miur";
import { importaLibriMinistero, totaleScheda, validaLibro, validaScheda } from "../lib/libriScuole";

// Gestionale libri scolastici (ex GS_MAG), sezione Scuole: anagrafica scuole e libri adottati per classe.
// Ci entra solo l'account del gestionale (/scuole), non quello del negozio.
const router = Router();
router.use(authenticateToken, authorizeRole(["SCUOLE"]), noStore);

const id = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const giaInserita = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
const testoFacoltativo = (v: unknown) => String(v ?? "").trim().slice(0, 200) || null;

function errore(res: Response, e: unknown, messaggio: string) {
  console.error(messaggio, e);
  res.status(500).json({ message: messaggio });
}

// ── Scuole ───────────────────────────────────────────────────────────────

// GET /api/libri/scuole?anno=2026 — scuole in ordine di nome, con il numero di classi dell'anno
router.get("/scuole", async (req: Request, res: Response) => {
  const anno = Number(req.query.anno) || new Date().getFullYear();
  try {
    const scuole = await prisma.scuola.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { schede: { where: { anno } } } } },
    });
    res.json(scuole.map(({ _count, ...s }) => ({ ...s, classi: _count.schede })));
  } catch (e) {
    errore(res, e, "Errore nel recupero delle scuole.");
  }
});

// GET /api/libri/scuole/ministero/:codice — anagrafica dal Ministero, senza salvare
router.get("/scuole/ministero/:codice", async (req: Request, res: Response) => {
  const codice = normalizzaCodiceScuola(req.params.codice);
  if (!codice) {
    res.status(400).json({ message: "Il codice scuola ha 10 lettere e cifre, es. NAPS930006." });
    return;
  }
  try {
    const scuola = await cercaScuolaMiur(codice);
    if (!scuola) {
      res.status(404).json({ message: `Il Ministero non ha una scuola statale con codice ${codice}.` });
      return;
    }
    res.json(scuola);
  } catch (e) {
    console.error("Errore Ministero (anagrafica):", e);
    res.status(502).json({ message: "Il sito del Ministero non risponde, riprova tra poco o scrivi i dati a mano." });
  }
});

const datiScuola = (body: any) => ({
  nome: String(body?.nome ?? "").trim().slice(0, 200),
  tipo: testoFacoltativo(body?.tipo),
  indirizzo: testoFacoltativo(body?.indirizzo),
  cap: testoFacoltativo(body?.cap),
  citta: testoFacoltativo(body?.citta),
  provincia: testoFacoltativo(body?.provincia),
});

// POST /api/libri/scuole — nuova scuola (dati presi dal Ministero o scritti a mano)
router.post("/scuole", async (req: Request, res: Response) => {
  const codice = normalizzaCodiceScuola(req.body?.codice);
  const dati = datiScuola(req.body);
  if (!codice) {
    res.status(400).json({ message: "Il codice scuola ha 10 lettere e cifre, es. NAPS930006." });
    return;
  }
  if (!dati.nome) {
    res.status(400).json({ message: "Inserire il nome della scuola." });
    return;
  }
  try {
    res.status(201).json(await prisma.scuola.create({ data: { codice, ...dati } }));
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `La scuola ${codice} è già in elenco.` });
    else errore(res, e, "Non è stato possibile salvare la scuola.");
  }
});

// PUT /api/libri/scuole/:id — modifica l'anagrafica (il codice non cambia)
router.put("/scuole/:id", async (req: Request, res: Response) => {
  const scuolaId = id(req.params.id);
  const dati = datiScuola(req.body);
  if (!scuolaId || !dati.nome) {
    res.status(400).json({ message: "Inserire il nome della scuola." });
    return;
  }
  try {
    res.json(await prisma.scuola.update({ where: { id: scuolaId }, data: dati }));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare la scuola.");
  }
});

// DELETE /api/libri/scuole/:id — solo se non ha più schede
router.delete("/scuole/:id", async (req: Request, res: Response) => {
  const scuolaId = id(req.params.id);
  if (!scuolaId) {
    res.status(400).json({ message: "Scuola non valida." });
    return;
  }
  try {
    const schede = await prisma.schedaScuola.count({ where: { scuolaId } });
    if (schede > 0) {
      res.status(409).json({ message: "Prima elimina le classi di questa scuola, di tutti gli anni." });
      return;
    }
    if (await prisma.schedaCliente.count({ where: { scuolaId } })) {
      res.status(409).json({ message: "Ci sono schede di clienti per questa scuola: la scuola non si può eliminare." });
      return;
    }
    await prisma.scuola.delete({ where: { id: scuolaId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare la scuola.");
  }
});

// GET /api/libri/scuole/:id/schede?anno=2026 — classi dell'anno con numero di libri e totale
router.get("/scuole/:id/schede", async (req: Request, res: Response) => {
  const scuolaId = id(req.params.id);
  const anno = Number(req.query.anno) || new Date().getFullYear();
  if (!scuolaId) {
    res.status(400).json({ message: "Scuola non valida." });
    return;
  }
  try {
    const schede = await prisma.schedaScuola.findMany({
      where: { scuolaId, anno },
      orderBy: [{ classe: "asc" }, { corso: "asc" }],
      include: { libri: { select: { prezzo: true } } },
    });
    res.json(
      schede.map(({ libri, ...s }) => ({ ...s, numeroLibri: libri.length, totale: totaleScheda(libri) }))
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero delle classi.");
  }
});

// POST /api/libri/scuole/:id/importa { anno } — tutte le classi e i loro libri dal Ministero
router.post("/scuole/:id/importa", async (req: Request, res: Response) => {
  const scuolaId = id(req.params.id);
  const anno = Number(req.body?.anno);
  if (!scuolaId || !Number.isInteger(anno)) {
    res.status(400).json({ message: "Scuola o anno non validi." });
    return;
  }
  const scuola = await prisma.scuola.findUnique({ where: { id: scuolaId } });
  if (!scuola) {
    res.status(404).json({ message: "Scuola non trovata." });
    return;
  }
  let libri;
  try {
    libri = await libriAdottatiMiur(scuola.codice);
  } catch (e) {
    console.error("Errore Ministero (adozioni):", e);
    res.status(502).json({ message: "Il sito del Ministero non risponde, riprova tra poco." });
    return;
  }
  if (libri.length === 0) {
    res.status(404).json({ message: "Il Ministero non ha libri adottati per questa scuola." });
    return;
  }
  try {
    res.json(await importaLibriMinistero(scuolaId, anno, libri));
  } catch (e) {
    errore(res, e, "Non è stato possibile importare i libri.");
  }
});

// ── Schede (classi) ──────────────────────────────────────────────────────

// POST /api/libri/schede { scuolaId, anno, classe, corso } — nuova classe a mano
router.post("/schede", async (req: Request, res: Response) => {
  const scuolaId = id(req.body?.scuolaId);
  const v = validaScheda(req.body);
  if (!scuolaId) {
    res.status(400).json({ message: "Scegliere la scuola." });
    return;
  }
  if ("errore" in v) {
    res.status(400).json({ message: v.errore });
    return;
  }
  try {
    res.status(201).json(await prisma.schedaScuola.create({ data: { scuolaId, ...v } }));
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `La classe ${v.classe} è già inserita per il ${v.anno}.` });
    else errore(res, e, "Non è stato possibile salvare la classe.");
  }
});

// GET /api/libri/schede/:id — classe con scuola, libri in ordine di codice e totale
router.get("/schede/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Classe non valida." });
    return;
  }
  try {
    const scheda = await prisma.schedaScuola.findUnique({
      where: { id: schedaId },
      include: { scuola: true, libri: { orderBy: { isbn: "asc" } } },
    });
    if (!scheda) {
      res.status(404).json({ message: "Classe non trovata." });
      return;
    }
    res.json({ ...scheda, totale: totaleScheda(scheda.libri) });
  } catch (e) {
    errore(res, e, "Errore nel recupero della classe.");
  }
});

// PUT /api/libri/schede/:id { anno, classe, corso }
router.put("/schede/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const v = validaScheda(req.body);
  if (!schedaId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Classe non valida." });
    return;
  }
  try {
    res.json(await prisma.schedaScuola.update({ where: { id: schedaId }, data: v }));
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `La classe ${v.classe} è già inserita per il ${v.anno}.` });
    else errore(res, e, "Non è stato possibile salvare la classe.");
  }
});

// DELETE /api/libri/schede/:id — la classe e tutti i suoi libri
router.delete("/schede/:id", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  if (!schedaId) {
    res.status(400).json({ message: "Classe non valida." });
    return;
  }
  try {
    await prisma.schedaScuola.delete({ where: { id: schedaId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare la classe.");
  }
});

// POST /api/libri/schede/:id/importa — libri di questa classe dal Ministero
router.post("/schede/:id/importa", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const scheda = schedaId
    ? await prisma.schedaScuola.findUnique({ where: { id: schedaId }, include: { scuola: true } })
    : null;
  if (!scheda) {
    res.status(404).json({ message: "Classe non trovata." });
    return;
  }
  let libri;
  try {
    libri = await libriAdottatiMiur(scheda.scuola.codice, scheda.classe);
  } catch (e) {
    const classeNonValida = e instanceof Error && e.message.startsWith("Classe non valida");
    if (!classeNonValida) console.error("Errore Ministero (adozioni classe):", e);
    res
      .status(classeNonValida ? 400 : 502)
      .json({ message: classeNonValida ? (e as Error).message : "Il sito del Ministero non risponde, riprova tra poco." });
    return;
  }
  if (libri.length === 0) {
    res.status(404).json({ message: `Il Ministero non ha libri adottati per la classe ${scheda.classe}.` });
    return;
  }
  try {
    res.json(await importaLibriMinistero(scheda.scuolaId, scheda.anno, libri, scheda));
  } catch (e) {
    errore(res, e, "Non è stato possibile importare i libri.");
  }
});

// ── Libri della classe ───────────────────────────────────────────────────

// GET /api/libri/catalogo/:isbn — ultimo libro con quel codice in qualsiasi classe, per compilare la riga
router.get("/catalogo/:isbn", async (req: Request, res: Response) => {
  const isbn = String(req.params.isbn || "").replace(/[\s-]/g, "").toUpperCase();
  try {
    const libro = await prisma.schedaScuolaLibro.findFirst({
      where: { isbn },
      orderBy: { updatedAt: "desc" },
      select: {
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
      },
    });
    if (!libro) {
      res.status(404).json({ message: "Libro mai inserito." });
      return;
    }
    res.json(libro);
  } catch (e) {
    errore(res, e, "Errore nella ricerca del libro.");
  }
});

// POST /api/libri/schede/:id/libri — aggiunge un libro alla classe
router.post("/schede/:id/libri", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const v = validaLibro(req.body);
  if (!schedaId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Classe non valida." });
    return;
  }
  try {
    res.status(201).json(await prisma.schedaScuolaLibro.create({ data: { schedaId, ...v.libro } }));
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `Codice ${v.libro.isbn} già inserito in questa classe.` });
    else errore(res, e, "Non è stato possibile aggiungere il libro.");
  }
});

// PUT /api/libri/schede/:id/libri/:libroId
router.put("/schede/:id/libri/:libroId", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const libroId = id(req.params.libroId);
  const v = validaLibro(req.body);
  if (!schedaId || !libroId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Libro non valido." });
    return;
  }
  try {
    const { count } = await prisma.schedaScuolaLibro.updateMany({ where: { id: libroId, schedaId }, data: v.libro });
    if (count === 0) {
      res.status(404).json({ message: "Libro non trovato." });
      return;
    }
    res.json(await prisma.schedaScuolaLibro.findUnique({ where: { id: libroId } }));
  } catch (e) {
    if (giaInserita(e)) res.status(409).json({ message: `Codice ${v.libro.isbn} già inserito in questa classe.` });
    else errore(res, e, "Non è stato possibile salvare il libro.");
  }
});

// DELETE /api/libri/schede/:id/libri/:libroId
router.delete("/schede/:id/libri/:libroId", async (req: Request, res: Response) => {
  const schedaId = id(req.params.id);
  const libroId = id(req.params.libroId);
  if (!schedaId || !libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    await prisma.schedaScuolaLibro.deleteMany({ where: { id: libroId, schedaId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare il libro.");
  }
});

export default router;
