import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore, parseId, parseIdList } from "../lib/http";
import { normalizeCode } from "../lib/coupons";
import { toNumber } from "../lib/pricing";

// Codici sconto per il carrello (basati sul modello Promotion).
// La verifica pubblica avviene con POST /api/cart/quote { couponCode }.
const router = Router();
router.use(authenticateToken, authorizeRole(["ADMIN"]), noStore);

const include = {
  products: { select: { id: true, titolo: true } },
  categories: { select: { id: true, name: true } },
} satisfies Prisma.PromotionInclude;

const serialize = (p: Prisma.PromotionGetPayload<{ include: typeof include }>) => ({
  id: p.id,
  codice: p.code,
  nome: p.name,
  descrizione: p.description,
  tipo: p.discountPercentage ? "percentuale" : "importo",
  valore: toNumber(p.discountPercentage ?? p.discountAmount),
  minimoOrdine: p.minimoOrdine ? toNumber(p.minimoOrdine) : null,
  maxUtilizzi: p.maxUtilizzi,
  utilizzi: p.utilizzi,
  inizio: p.startDate,
  fine: p.endDate,
  attivo: p.isActive,
  prodotti: p.products,
  categorie: p.categories,
  createdAt: p.createdAt,
});

const readCoupon = (body: any, partial: boolean) => {
  const errors: string[] = [];
  const data: Prisma.PromotionUpdateInput = {};
  if (body.codice !== undefined || !partial) {
    const code = normalizeCode(body.codice);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      errors.push("Il codice deve avere 3-30 caratteri (lettere, numeri, - o _).");
    }
    data.code = code;
    data.name = body.nome ? String(body.nome) : code;
  } else if (body.nome !== undefined) {
    data.name = String(body.nome);
  }
  if (body.descrizione !== undefined) data.description = body.descrizione || null;
  if (body.tipo !== undefined || body.valore !== undefined || !partial) {
    const valore = parseFloat(String(body.valore ?? "").replace(",", "."));
    if (!Number.isFinite(valore) || valore <= 0) errors.push("Il valore dello sconto deve essere positivo.");
    if (body.tipo === "percentuale") {
      if (valore >= 100) errors.push("La percentuale deve essere inferiore a 100.");
      data.discountPercentage = valore;
      data.discountAmount = null;
    } else {
      data.discountAmount = valore;
      data.discountPercentage = null;
    }
  }
  if (body.minimoOrdine !== undefined) {
    const v = parseFloat(String(body.minimoOrdine ?? "").replace(",", "."));
    data.minimoOrdine = Number.isFinite(v) && v > 0 ? v : null;
  }
  if (body.maxUtilizzi !== undefined) {
    const v = parseInt(body.maxUtilizzi, 10);
    data.maxUtilizzi = Number.isFinite(v) && v > 0 ? v : null;
  }
  if (body.inizio !== undefined || !partial) data.startDate = body.inizio ? new Date(body.inizio) : new Date();
  if (body.fine !== undefined || !partial) {
    data.endDate = body.fine ? new Date(body.fine) : new Date("2099-12-31T23:59:59Z");
  }
  if (body.attivo !== undefined) data.isActive = !!body.attivo;
  if (body.prodottiIds !== undefined) {
    data.products = { set: parseIdList(body.prodottiIds).map((id) => ({ id })) };
  }
  if (body.categorieIds !== undefined) {
    data.categories = { set: parseIdList(body.categorieIds).map((id) => ({ id })) };
  }
  if (data.startDate && data.endDate && (data.endDate as Date) <= (data.startDate as Date)) {
    errors.push("La data di fine deve essere successiva alla data di inizio.");
  }
  return { data, errors };
};

router.get("/", async (req: Request, res: Response) => {
  const coupons = await prisma.promotion.findMany({
    where: { code: { not: null } },
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json(coupons.map(serialize));
});

router.post("/", async (req: Request, res: Response) => {
  const { data, errors } = readCoupon(req.body || {}, false);
  if (errors.length) {
    res.status(400).json({ message: errors.join(" "), errors });
    return;
  }
  try {
    const { products, categories, ...rest } = data;
    const created = await prisma.promotion.create({
      data: {
        ...(rest as Prisma.PromotionCreateInput),
        products: products?.set ? { connect: products.set as { id: number }[] } : undefined,
        categories: categories?.set ? { connect: categories.set as { id: number }[] } : undefined,
      },
      include,
    });
    res.status(201).json(serialize(created));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "Esiste già un codice sconto con questo nome." });
      return;
    }
    console.error("Errore creazione coupon:", error);
    res.status(500).json({ message: "Errore nella creazione del codice sconto" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { data, errors } = readCoupon(req.body || {}, true);
  if (errors.length) {
    res.status(400).json({ message: errors.join(" "), errors });
    return;
  }
  try {
    const updated = await prisma.promotion.update({ where: { id }, data, include });
    res.json(serialize(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({ message: "Esiste già un codice sconto con questo nome." });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({ message: "Codice sconto non trovato" });
        return;
      }
    }
    console.error("Errore aggiornamento coupon:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del codice sconto" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  await prisma.promotion.deleteMany({ where: { id: parseId(req.params.id) } });
  res.json({ message: "Codice sconto eliminato" });
});

export default router;
