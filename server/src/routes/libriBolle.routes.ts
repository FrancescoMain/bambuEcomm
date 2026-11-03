import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore } from "../lib/http";
import { barcodeScheda } from "../lib/libriClienti";
import { validaLibro } from "../lib/libriScuole";
import { normalizzaIsbn } from "../lib/libriMagazzino";
import { datiLibri, type DatiLibro } from "../lib/libriCatalogo";
import { scegliCopia } from "../lib/libriBolle";
import { blocca, Cambiati, CLIENTE } from "../lib/libriTx";
import { giorniAttesa, sogliaAttesa, vuoleIlNuovo } from "../lib/libriUsato";

// Gestionale libri scolastici (ex GS_MAG), sezione Bolle: l'arrivo della merce dal fornitore. Si legge ogni libro
// col lettore (una copia per lettura) e la copia va da sola al cliente che la aspetta («Assegnato») o in Magazzino.
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

const testo = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const arrotonda = (n: number) => Math.round(n * 100) / 100;
const DATI = { isbn: true, materia: true, autori: true, titolo: true, volume: true, editore: true, prezzo: true } as const;
const soloDati = (l: DatiLibro): DatiLibro => ({
  isbn: l.isbn,
  materia: l.materia,
  autori: l.autori,
  titolo: l.titolo,
  volume: l.volume,
  editore: l.editore,
  prezzo: l.prezzo,
});

const RIGA = {
  // Classe e telefono servono al riquadro «dove va» e all'etichetta da attaccare al libro
  libro: { select: { id: true, stato: true, scheda: { select: { ...CLIENTE.scheda.select, classe: true, telefono: true } } } },
  ordineRiga: { select: { id: true, ordine: { select: { id: true, anno: true, numero: true } } } },
} as const;

async function leggiBolla(bollaId: number) {
  const bolla = await prisma.bollaArrivo.findUnique({
    where: { id: bollaId },
    include: { righe: { orderBy: { id: "desc" }, include: RIGA } },
  });
  if (!bolla) return null;
  return {
    ...bolla,
    barcode: barcodeScheda(bolla.anno, bolla.numero),
    totale: arrotonda(bolla.righe.reduce((t, r) => t + Number(r.prezzo), 0)),
  };
}

// GET /api/libri/bolle?anno= — elenco delle bolle con copie arrivate, ai clienti, in magazzino e totale
router.get("/", async (req: Request, res: Response) => {
  const anno = Number(req.query.anno);
  try {
    const bolle = await prisma.bollaArrivo.findMany({
      where: Number.isInteger(anno) && anno > 0 ? { anno } : {},
      orderBy: [{ anno: "desc" }, { numero: "desc" }],
      take: 300,
      include: { righe: { select: { prezzo: true, destinazione: true } } },
    });
    res.json(
      bolle.map(({ righe, ...b }) => ({
        ...b,
        barcode: barcodeScheda(b.anno, b.numero),
        copie: righe.length,
        aClienti: righe.filter((r) => r.destinazione === "CLIENTE").length,
        inMagazzino: righe.filter((r) => r.destinazione === "MAGAZZINO").length,
        totale: arrotonda(righe.reduce((t, r) => t + Number(r.prezzo), 0)),
      }))
    );
  } catch (e) {
    errore(res, e, "Errore nel recupero delle bolle.");
  }
});

// POST /api/libri/bolle { numeroFornitore?, note? } — nuova bolla, numero progressivo per anno solare
router.post("/", async (req: Request, res: Response) => {
  try {
    const bollaId = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const anno = new Date().getFullYear();
      const ultima = await tx.bollaArrivo.aggregate({ where: { anno }, _max: { numero: true } });
      const bolla = await tx.bollaArrivo.create({
        data: { anno, numero: (ultima._max.numero ?? 0) + 1, numeroFornitore: testo(req.body?.numeroFornitore, 100), note: testo(req.body?.note, 1000) },
      });
      return bolla.id;
    });
    res.status(201).json(await leggiBolla(bollaId));
  } catch (e) {
    errore(res, e, "Non è stato possibile creare la bolla.");
  }
});

// GET /api/libri/bolle/:id
router.get("/:id", async (req: Request, res: Response) => {
  const bollaId = id(req.params.id);
  if (!bollaId) {
    res.status(400).json({ message: "Bolla non valida." });
    return;
  }
  try {
    const bolla = await leggiBolla(bollaId);
    if (!bolla) res.status(404).json({ message: "Bolla non trovata." });
    else res.json(bolla);
  } catch (e) {
    errore(res, e, "Errore nel recupero della bolla.");
  }
});

// PATCH /api/libri/bolle/:id { numeroFornitore?, note? }
router.patch("/:id", async (req: Request, res: Response) => {
  const bollaId = id(req.params.id);
  if (!bollaId) {
    res.status(400).json({ message: "Bolla non valida." });
    return;
  }
  const data: Prisma.BollaArrivoUpdateInput = {};
  if (req.body?.numeroFornitore !== undefined) data.numeroFornitore = testo(req.body.numeroFornitore, 100);
  if (req.body?.note !== undefined) data.note = testo(req.body.note, 1000);
  try {
    await prisma.bollaArrivo.update({ where: { id: bollaId }, data });
    res.json(await leggiBolla(bollaId));
  } catch (e) {
    errore(res, e, "Non è stato possibile salvare la bolla.");
  }
});

// DELETE /api/libri/bolle/:id — solo una bolla vuota (gli arrivi si annullano uno per uno)
router.delete("/:id", async (req: Request, res: Response) => {
  const bollaId = id(req.params.id);
  if (!bollaId) {
    res.status(400).json({ message: "Bolla non valida." });
    return;
  }
  try {
    const righe = await prisma.bollaRiga.count({ where: { bollaId } });
    if (righe) {
      res.status(409).json({ message: "La bolla ha libri arrivati: annulla prima gli arrivi, uno per uno." });
      return;
    }
    await prisma.bollaArrivo.deleteMany({ where: { id: bollaId } });
    res.status(204).end();
  } catch (e) {
    errore(res, e, "Non è stato possibile eliminare la bolla.");
  }
});

// POST /api/libri/bolle/:id/righe { isbn, …dati del libro } — è arrivata una copia. Evade la copia in ordine dello
// stesso codice (prima quelle dei clienti, a chi ha prenotato per primo); se non era di nessuno va al primo cliente
// che aspetta lo stesso libro, altrimenti in Magazzino. Un codice mai visto ha bisogno dei dati scritti a mano.
router.post("/:id/righe", async (req: Request, res: Response) => {
  const bollaId = id(req.params.id);
  const isbn = normalizzaIsbn(req.body?.isbn);
  if (!bollaId || !isbn || isbn.length > 30) {
    res.status(400).json({ message: !bollaId ? "Bolla non valida." : "Inserire il codice (ISBN)." });
    return;
  }
  let scritti: DatiLibro | null = null;
  if (req.body?.titolo !== undefined) {
    const v = validaLibro({ ...req.body, isbn });
    if ("errore" in v) {
      res.status(400).json({ message: v.errore });
      return;
    }
    const { nuovaAdozione: _n, daAcquistare: _a, consigliato: _c, ...libro } = v.libro;
    scritti = { ...libro, prezzo: new Prisma.Decimal(libro.prezzo) };
  }
  try {
    const esito = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      if (!(await tx.bollaArrivo.findUnique({ where: { id: bollaId }, select: { id: true } }))) return { nonTrovata: true as const };
      const adesso = new Date();

      const inOrdine = await tx.ordineRiga.findMany({
        where: { isbn, arrivatoAt: null },
        select: { id: true, libroId: true, ...DATI, libro: { select: { prenotatoAt: true } } },
      });
      const copia = scegliCopia(inOrdine.map((r) => ({ ...r, prenotatoAt: r.libro?.prenotatoAt ?? null })));
      const dati = copia ? soloDati(copia) : (scritti ?? (await datiLibri([isbn], tx)).get(isbn) ?? null);
      if (!dati) return { daCompilare: true as const };

      let libroId: number | null = null;
      if (copia) {
        await tx.ordineRiga.update({ where: { id: copia.id }, data: { arrivatoAt: adesso } });
        if (copia.libroId) {
          const { count } = await tx.schedaClienteLibro.updateMany({
            where: { id: copia.libroId, stato: "CONFERMATO" },
            data: { stato: "ASSEGNATO", assegnatoAt: adesso },
          });
          if (!count) throw new Cambiati();
          libroId = copia.libroId;
        }
      }
      if (!libroId) {
        // Copia di nessuno (per il negozio, annullata o fuori ordine): al primo che aspetta lo stesso libro nuovo
        const prossimo = await tx.schedaClienteLibro.findFirst({
          where: { isbn, stato: "PRENOTATO", ...vuoleIlNuovo(sogliaAttesa(await giorniAttesa(tx))) },
          orderBy: [{ prenotatoAt: "asc" }, { id: "asc" }],
          select: { id: true },
        });
        if (prossimo) {
          await tx.schedaClienteLibro.update({
            where: { id: prossimo.id },
            data: { stato: "ASSEGNATO", confermatoAt: copia ? adesso : null, assegnatoAt: adesso },
          });
          if (copia) await tx.ordineRiga.update({ where: { id: copia.id }, data: { libroId: prossimo.id } });
          libroId = prossimo.id;
        }
      }
      if (!libroId) {
        const g = await tx.giacenzaLibro.upsert({
          where: { isbn },
          create: { ...dati, isbn, quantita: 1 },
          update: { quantita: { increment: 1 } },
          select: { id: true },
        });
        await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta: 1, causale: "ARRIVO", bollaId } });
      }
      const riga = await tx.bollaRiga.create({
        data: { ...dati, isbn, bollaId, destinazione: libroId ? "CLIENTE" : "MAGAZZINO", ordineRigaId: copia?.id ?? null, libroId },
        include: RIGA,
      });
      return { riga };
    });
    if ("nonTrovata" in esito) res.status(404).json({ message: "Bolla non trovata." });
    else if ("daCompilare" in esito) {
      res.status(404).json({ message: `Il codice ${isbn} non è in nessun ordine, classe, scheda o magazzino: scrivi i dati del libro.`, daCompilare: true });
    } else res.status(201).json({ riga: esito.riga, bolla: await leggiBolla(bollaId) });
  } catch (e) {
    if (e instanceof Cambiati) res.status(409).json({ message: "Un'altra postazione ha cambiato questo libro: rileggilo." });
    else errore(res, e, "Non è stato possibile registrare l'arrivo.");
  }
});

// DELETE /api/libri/bolle/:id/righe/:rigaId — annulla un arrivo (letto per sbaglio): la copia torna in ordine, il
// cliente torna «Confermato» (o «Prenotato» se non era ordinata) e il Magazzino scende di uno
router.delete("/:id/righe/:rigaId", async (req: Request, res: Response) => {
  const bollaId = id(req.params.id);
  const rigaId = id(req.params.rigaId);
  if (!bollaId || !rigaId) {
    res.status(400).json({ message: "Riga non valida." });
    return;
  }
  try {
    const problema = await prisma.$transaction(async (tx) => {
      await blocca(tx);
      const riga = await tx.bollaRiga.findFirst({
        where: { id: rigaId, bollaId },
        select: { destinazione: true, isbn: true, ordineRigaId: true, libro: { select: { id: true, stato: true } } },
      });
      if (!riga) return null;
      if (riga.destinazione === "CLIENTE" && riga.libro) {
        if (riga.libro.stato !== "ASSEGNATO") return "Il cliente ha già ritirato il libro: annulla prima il ritiro dalla sua scheda.";
        await tx.schedaClienteLibro.update({
          where: { id: riga.libro.id },
          data: riga.ordineRigaId ? { stato: "CONFERMATO", assegnatoAt: null } : { stato: "PRENOTATO", confermatoAt: null, assegnatoAt: null },
        });
      }
      if (riga.destinazione === "MAGAZZINO") {
        const { count } = await tx.giacenzaLibro.updateMany({
          where: { isbn: riga.isbn, quantita: { gte: 1 } },
          data: { quantita: { decrement: 1 } },
        });
        if (!count) return "La copia non è più in Magazzino (data a un cliente o tolta): non si può annullare l'arrivo.";
        const g = await tx.giacenzaLibro.findUniqueOrThrow({ where: { isbn: riga.isbn }, select: { id: true } });
        await tx.movimentoGiacenza.create({ data: { giacenzaId: g.id, delta: -1, causale: "ARRIVO_ANNULLATO", bollaId } });
      }
      if (riga.ordineRigaId) await tx.ordineRiga.update({ where: { id: riga.ordineRigaId }, data: { arrivatoAt: null } });
      await tx.bollaRiga.delete({ where: { id: rigaId } });
      return null;
    });
    if (problema) res.status(409).json({ message: problema });
    else res.json(await leggiBolla(bollaId));
  } catch (e) {
    errore(res, e, "Non è stato possibile annullare l'arrivo.");
  }
});

export default router;
