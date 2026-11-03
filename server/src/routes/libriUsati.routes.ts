import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { validaLibro } from "../lib/libriScuole";
import { normalizzaIsbn } from "../lib/libriMagazzino";
import { datiLibri, type DatiLibro } from "../lib/libriCatalogo";
import { blocca, CLIENTE } from "../lib/libriTx";
import {
  codiceCopia,
  contiVenditore,
  eCodiceCopia,
  giorniAttesa,
  leggiPercentuale,
  prezziUsato,
  salvaGiorniAttesa,
  statoCopia,
} from "../lib/libriUsato";

// Gestionale libri scolastici, libri usati: si comprano al banco in conto vendita (scheda di chi vende), ogni copia ha
// un codice nostro sull'etichetta, la sera si leggono e vanno a chi le aspetta. Il venditore si paga solo per le copie
// vendute (ritirate dal cliente), e il pagamento lo segna il negozio a mano.
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

const testo = (v: unknown, max = 100) => String(v ?? "").trim().slice(0, max);

const COPIA = {
  venditore: { select: { id: true, cognome: true, nome: true } },
  libro: { select: { id: true, stato: true, scheda: { select: { ...CLIENTE.scheda.select, classe: true, telefono: true } } } },
} as const;

type CopiaLetta = Prisma.CopiaUsataGetPayload<{ include: typeof COPIA }>;
const conStato = (c: CopiaLetta) => ({ ...c, stato: statoCopia(c) });

// ── Impostazioni ─────────────────────────────────────────────────────────

router.get("/impostazioni", async (_req: Request, res: Response) => {
  try {
    res.json({ giorniAttesa: await giorniAttesa() });
  } catch (e) {
    errore(res, e, "Errore nel recupero delle impostazioni.");
  }
});

// PUT /api/libri/usati/impostazioni { giorniAttesa } — dopo quanti giorni chi aspetta l'usato si ordina nuovo
router.put("/impostazioni", async (req: Request, res: Response) => {
  const giorni = Number(req.body?.giorniAttesa);
  if (!Number.isInteger(giorni) || giorni < 0 || giorni > 365) {
    res.status(400).json({ message: "I giorni di attesa sono un numero intero da 0 a 365." });
    return;
  }
  try {
    await salvaGiorniAttesa(giorni);
    res.json({ giorniAttesa: giorni });
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare le impostazioni.");
  }
});

// ── Venditori (chi porta i libri) ────────────────────────────────────────

function validaVenditore(body: any) {
  const v = { cognome: testo(body?.cognome), nome: testo(body?.nome), telefono: testo(body?.telefono, 40), note: testo(body?.note, 1000) };
  if (!v.cognome) return { errore: "Inserire il cognome." };
  if (!v.nome) return { errore: "Inserire il nome." };
  return { venditore: v };
}

async function leggiVenditore(venditoreId: number) {
  const v = await prisma.venditore.findUnique({
    where: { id: venditoreId },
    include: { copie: { orderBy: { id: "desc" }, include: COPIA } },
  });
  if (!v) return null;
  const copie = v.copie.map(conStato);
  return { ...v, copie, conti: contiVenditore(copie) };
}

// GET /api/libri/usati/venditori?q= — con i conti: copie in negozio, vendute, da pagare
router.get("/venditori", async (req: Request, res: Response) => {
  const q = testo(req.query.q);
  try {
    const venditori = await prisma.venditore.findMany({
      where: q
        ? { OR: (["cognome", "nome", "telefono"] as const).map((k) => ({ [k]: { contains: q, mode: "insensitive" as const } })) }
        : {},
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
      take: 500,
      include: { copie: { select: { libroId: true, pagataAt: true, prezzoAcquisto: true, libro: { select: { stato: true } } } } },
    });
    res.json(venditori.map(({ copie, ...v }) => ({ ...v, conti: contiVenditore(copie.map((c) => ({ ...c, stato: statoCopia(c) }))) })));
  } catch (e) {
    errore(res, e, "Errore nel recupero dei venditori.");
  }
});

router.post("/venditori", async (req: Request, res: Response) => {
  const v = validaVenditore(req.body);
  if ("errore" in v) {
    res.status(400).json({ message: v.errore });
    return;
  }
  try {
    const nuovo = await prisma.venditore.create({ data: v.venditore });
    res.status(201).json(await leggiVenditore(nuovo.id));
  } catch (e) {
    errore(res, e, "Non è stato possibile creare il venditore.");
  }
});

router.get("/venditori/:id", async (req: Request, res: Response) => {
  const venditoreId = id(req.params.id);
  if (!venditoreId) {
    res.status(400).json({ message: "Venditore non valido." });
    return;
  }
  try {
    const v = await leggiVenditore(venditoreId);
    if (!v) res.status(404).json({ message: "Venditore non trovato." });
    else res.json(v);
  } catch (e) {
    errore(res, e, "Errore nel recupero del venditore.");
  }
});

router.put("/venditori/:id", async (req: Request, res: Response) => {
  const venditoreId = id(req.params.id);
  const v = validaVenditore(req.body);
  if (!venditoreId || "errore" in v) {
    res.status(400).json({ message: "errore" in v ? v.errore : "Venditore non valido." });
    return;
  }
  try {
    await prisma.venditore.update({ where: { id: venditoreId }, data: v.venditore });
    res.json(await leggiVenditore(venditoreId));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare il venditore.");
  }
});

// DELETE /api/libri/usati/venditori/:id — solo se non ha copie
router.delete("/venditori/:id", async (req: Request, res: Response) => {
  const venditoreId = id(req.params.id);
  if (!venditoreId) {
    res.status(400).json({ message: "Venditore non valido." });
    return;
  }
  try {
    if (await prisma.copiaUsata.count({ where: { venditoreId } })) {
      res.status(409).json({ message: "Il venditore ha copie: non si può eliminare." });
      return;
    }
    await prisma.venditore.deleteMany({ where: { id: venditoreId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare il venditore.");
  }
});

// POST /api/libri/usati/venditori/:id/paga — segna pagate tutte le copie vendute e non ancora pagate
router.post("/venditori/:id/paga", async (req: Request, res: Response) => {
  const venditoreId = id(req.params.id);
  if (!venditoreId) {
    res.status(400).json({ message: "Venditore non valido." });
    return;
  }
  try {
    const { count } = await prisma.copiaUsata.updateMany({
      where: { venditoreId, pagataAt: null, libro: { stato: "RITIRATO" } },
      data: { pagataAt: new Date() },
    });
    res.json({ pagate: count, venditore: await leggiVenditore(venditoreId) });
  } catch (e) {
    errore(res, e, "Non è stato possibile segnare il pagamento.");
  }
});

// ── Copie usate ──────────────────────────────────────────────────────────

/** Percentuali della richiesta, entrambe obbligatorie: si scrivono copia per copia quando la si compra. */
function leggiPercentuali(body: any) {
  const scontoVendita = leggiPercentuale(body?.scontoVendita);
  const percentualeAcquisto = leggiPercentuale(body?.percentualeAcquisto);
  if (scontoVendita === null) return { errore: "Scrivi lo sconto di vendita (da 0 a 100 %)." };
  if (percentualeAcquisto === null) return { errore: "Scrivi la percentuale pagata al venditore (da 0 a 100 %)." };
  return { scontoVendita, percentualeAcquisto };
}

// POST /api/libri/usati/venditori/:id/copie { isbn, scontoVendita, percentualeAcquisto, …dati del libro } — una copia
// comprata al banco. Il codice nostro si stampa sull'etichetta da attaccare al libro.
router.post("/venditori/:id/copie", async (req: Request, res: Response) => {
  const venditoreId = id(req.params.id);
  const isbn = normalizzaIsbn(req.body?.isbn);
  const p = leggiPercentuali(req.body);
  if (!venditoreId || !isbn || isbn.length > 30 || "errore" in p) {
    res.status(400).json({ message: "errore" in p ? p.errore : !venditoreId ? "Venditore non valido." : "Inserire il codice (ISBN)." });
    return;
  }
  let dati: DatiLibro | null = null;
  if (req.body?.titolo !== undefined) {
    const v = validaLibro({ ...req.body, isbn });
    if ("errore" in v) {
      res.status(400).json({ message: v.errore });
      return;
    }
    const { nuovaAdozione: _n, daAcquistare: _a, consigliato: _c, ...libro } = v.libro;
    dati = { ...libro, prezzo: new Prisma.Decimal(libro.prezzo) };
  }
  try {
    dati ??= (await datiLibri([isbn])).get(isbn) ?? null;
    if (!dati) {
      res.status(404).json({ message: `Il codice ${isbn} non è in nessuna classe, scheda o magazzino: scrivi i dati del libro.`, daCompilare: true });
      return;
    }
    const libro = dati;
    const copia = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      if (!(await tx.venditore.findUnique({ where: { id: venditoreId }, select: { id: true } }))) return null;
      const anno = new Date().getFullYear();
      const ultima = await tx.copiaUsata.findFirst({ where: { codice: { startsWith: String(anno) } }, orderBy: { codice: "desc" }, select: { codice: true } });
      const numero = ultima ? Number(ultima.codice.slice(4)) + 1 : 1;
      return tx.copiaUsata.create({
        data: {
          ...libro,
          isbn,
          codice: codiceCopia(anno, numero),
          venditoreId,
          ...p,
          ...prezziUsato(Number(libro.prezzo), p.scontoVendita, p.percentualeAcquisto),
        },
        include: COPIA,
      });
    });
    if (!copia) {
      res.status(404).json({ message: "Venditore non trovato." });
      return;
    }
    const inAttesa = await prisma.schedaClienteLibro.count({ where: { isbn, usato: true, stato: "PRENOTATO" } });
    res.status(201).json({ copia: conStato(copia), inAttesa });
  } catch (e) {
    errore(res, e, "Non è stato possibile registrare la copia.");
  }
});

// PUT /api/libri/usati/copie/:id { scontoVendita, percentualeAcquisto } — solo finché la copia è in negozio
router.put("/copie/:id", async (req: Request, res: Response) => {
  const copiaId = id(req.params.id);
  const p = leggiPercentuali(req.body);
  if (!copiaId || "errore" in p) {
    res.status(400).json({ message: "errore" in p ? p.errore : "Copia non valida." });
    return;
  }
  try {
    const c = await prisma.copiaUsata.findUnique({ where: { id: copiaId }, select: { prezzo: true, libroId: true } });
    if (!c) {
      res.status(404).json({ message: "Copia non trovata." });
      return;
    }
    if (c.libroId) {
      res.status(409).json({ message: "La copia è già di un cliente: rimettila in negozio prima di cambiare i prezzi." });
      return;
    }
    const copia = await prisma.copiaUsata.update({
      where: { id: copiaId },
      data: { ...p, ...prezziUsato(Number(c.prezzo), p.scontoVendita, p.percentualeAcquisto) },
      include: COPIA,
    });
    res.json(conStato(copia));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare la copia.");
  }
});

// DELETE /api/libri/usati/copie/:id — solo una copia ancora in negozio (inserita per sbaglio, o resa al venditore)
router.delete("/copie/:id", async (req: Request, res: Response) => {
  const copiaId = id(req.params.id);
  if (!copiaId) {
    res.status(400).json({ message: "Copia non valida." });
    return;
  }
  try {
    const { count } = await prisma.copiaUsata.deleteMany({ where: { id: copiaId, libroId: null, pagataAt: null } });
    if (!count && (await prisma.copiaUsata.count({ where: { id: copiaId } }))) {
      res.status(409).json({ message: "La copia è già di un cliente: non si può eliminare." });
      return;
    }
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare la copia.");
  }
});

// POST /api/libri/usati/copie/:id/pagata { pagata } — il negozio segna (o toglie) il pagamento al venditore
router.post("/copie/:id/pagata", async (req: Request, res: Response) => {
  const copiaId = id(req.params.id);
  if (!copiaId) {
    res.status(400).json({ message: "Copia non valida." });
    return;
  }
  const pagata = req.body?.pagata === true;
  try {
    const { count } = await prisma.copiaUsata.updateMany({
      where: { id: copiaId, libro: { stato: "RITIRATO" } },
      data: { pagataAt: pagata ? new Date() : null },
    });
    if (!count) {
      res.status(409).json({ message: "Si paga solo una copia venduta (ritirata dal cliente)." });
      return;
    }
    res.json(conStato(await prisma.copiaUsata.findUniqueOrThrow({ where: { id: copiaId }, include: COPIA })));
  } catch (e) {
    errore(res, e, "Non è stato possibile segnare il pagamento.");
  }
});

// GET /api/libri/usati/in-negozio?q= — le copie usate ancora di nessuno, con quanti clienti aspettano lo stesso libro
router.get("/in-negozio", async (req: Request, res: Response) => {
  const q = testo(req.query.q);
  try {
    const copie = await prisma.copiaUsata.findMany({
      where: {
        libroId: null,
        ...(q ? { OR: [{ codice: { startsWith: q } }, { isbn: { startsWith: normalizzaIsbn(q) } }, { titolo: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ isbn: "asc" }, { codice: "asc" }],
      take: 2000,
      include: COPIA,
    });
    const attese = await prisma.schedaClienteLibro.groupBy({
      by: ["isbn"],
      where: { isbn: { in: [...new Set(copie.map((c) => c.isbn))] }, usato: true, stato: "PRENOTATO" },
      _count: true,
    });
    const inAttesa = new Map(attese.map((a) => [a.isbn, a._count]));
    res.json(copie.map((c) => ({ ...conStato(c), inAttesa: inAttesa.get(c.isbn) ?? 0 })));
  } catch (e) {
    errore(res, e, "Errore nel recupero delle copie usate.");
  }
});

// ── Assegnazione ai clienti ──────────────────────────────────────────────

/** La copia usata va al libro del cliente: Assegnato, al prezzo della copia. */
async function assegna(tx: Prisma.TransactionClient, copiaId: number, libroId: number, prezzoVendita: Prisma.Decimal) {
  const adesso = new Date();
  await tx.schedaClienteLibro.update({
    where: { id: libroId },
    data: { stato: "ASSEGNATO", usato: true, assegnatoAt: adesso, confermatoAt: null, prezzoUsato: prezzoVendita },
  });
  await tx.copiaUsata.update({ where: { id: copiaId }, data: { libroId, assegnataAt: adesso } });
}

// POST /api/libri/usati/assegna { codice } — la sera si leggono le copie comprate: ognuna va al primo cliente che aspetta
// lo stesso libro usato (in ordine di prenotazione), altrimenti resta in negozio
router.post("/assegna", async (req: Request, res: Response) => {
  const codice = testo(req.body?.codice, 30).replace(/\s/g, "");
  if (!eCodiceCopia(codice)) {
    res.status(400).json({
      message: /^\d{13}$/.test(codice) ? "Questo è il codice del libro: leggi il nostro codice sull'etichetta della copia (10 cifre)." : "Codice della copia non valido.",
    });
    return;
  }
  try {
    const esito = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const copia = await tx.copiaUsata.findUnique({ where: { codice }, include: COPIA });
      if (!copia) return { errore: `Nessuna copia usata con il codice ${codice}.` };
      if (copia.libroId) return { copia: conStato(copia), giaAssegnata: true };
      const prossimo = await tx.schedaClienteLibro.findFirst({
        where: { isbn: copia.isbn, usato: true, stato: "PRENOTATO" },
        orderBy: [{ prenotatoAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (prossimo) await assegna(tx, copia.id, prossimo.id, copia.prezzoVendita);
      return { copia: conStato(await tx.copiaUsata.findUniqueOrThrow({ where: { id: copia.id }, include: COPIA })), giaAssegnata: false };
    });
    if ("errore" in esito) res.status(404).json({ message: esito.errore });
    else res.json(esito);
  } catch (e) {
    errore(res, e, "Non è stato possibile assegnare la copia.");
  }
});

// POST /api/libri/usati/dai { libroId, codice? } — dalla scheda del cliente: gli si dà subito una copia usata in negozio
// (quella letta col lettore, altrimenti la più vecchia dello stesso libro). Mai per i «New».
router.post("/dai", async (req: Request, res: Response) => {
  const libroId = id(req.body?.libroId);
  const codice = testo(req.body?.codice, 30).replace(/\s/g, "");
  if (!libroId || (codice && !eCodiceCopia(codice))) {
    res.status(400).json({ message: "Richiesta non valida." });
    return;
  }
  try {
    const esito = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const libro = await tx.schedaClienteLibro.findUnique({ where: { id: libroId }, select: { stato: true, isbn: true, nuovaAdozione: true } });
      if (!libro || (libro.stato !== "IN_LISTA" && libro.stato !== "PRENOTATO")) return "Il libro è già ordinato o assegnato: ricarica la scheda.";
      if (libro.nuovaAdozione) return "È una nuova adozione («New»): si trova solo nuovo.";
      const copia = await tx.copiaUsata.findFirst({
        where: { isbn: libro.isbn, libroId: null, ...(codice ? { codice } : {}) },
        orderBy: { codice: "asc" },
        select: { id: true, prezzoVendita: true },
      });
      if (!copia) return codice ? "Questa copia non è in negozio o è di un altro libro." : "Non ci sono copie usate di questo libro in negozio.";
      await assegna(tx, copia.id, libroId, copia.prezzoVendita);
      return null;
    });
    if (esito) res.status(409).json({ message: esito });
    else res.json({ ok: true });
  } catch (e) {
    errore(res, e, "Non è stato possibile dare la copia usata.");
  }
});

// POST /api/libri/usati/rimetti { libroId } — la copia usata torna in negozio e il cliente torna «Prenotato» (usato)
router.post("/rimetti", async (req: Request, res: Response) => {
  const libroId = id(req.body?.libroId);
  if (!libroId) {
    res.status(400).json({ message: "Libro non valido." });
    return;
  }
  try {
    const rimessa = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const libro = await tx.schedaClienteLibro.findFirst({ where: { id: libroId, stato: "ASSEGNATO" }, select: { copiaUsata: { select: { id: true } } } });
      if (!libro?.copiaUsata) return false;
      await tx.copiaUsata.update({ where: { id: libro.copiaUsata.id }, data: { libroId: null, assegnataAt: null } });
      await tx.schedaClienteLibro.update({ where: { id: libroId }, data: { stato: "PRENOTATO", assegnatoAt: null, prezzoUsato: null, usatoDal: new Date() } });
      return true;
    });
    if (!rimessa) res.status(409).json({ message: "Il libro non ha una copia usata da rimettere (o è già ritirato)." });
    else res.json({ ok: true });
  } catch (e) {
    errore(res, e, "Non è stato possibile rimettere la copia in negozio.");
  }
});

export default router;
