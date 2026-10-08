import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole, optionalAuth, AuthRequest } from "../middleware/auth.middleware";
import { isBot, noStore, parseId, publicCache, rateLimit, revalidateStorefront } from "../lib/http";

const router = Router();

// GET /api/reviews/product/:productId — recensioni approvate
router.get("/product/:productId", publicCache(120, 900), async (req: Request, res: Response) => {
  const productId = parseId(req.params.productId);
  if (isNaN(productId)) {
    res.status(400).json({ message: "Prodotto non valido" });
    return;
  }
  const [reviews, agg] = await Promise.all([
    prisma.review.findMany({
      where: { productId, approvata: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, nome: true, voto: true, testo: true, createdAt: true, userId: true },
    }),
    prisma.review.aggregate({
      where: { productId, approvata: true },
      _avg: { voto: true },
      _count: { _all: true },
    }),
  ]);
  res.json({
    media: agg._avg.voto ? Math.round(agg._avg.voto * 10) / 10 : null,
    totale: agg._count._all,
    recensioni: reviews.map(({ userId, ...r }) => ({ ...r, verificata: !!userId })),
  });
});

// POST /api/reviews { productId, nome, voto, testo } — in attesa di approvazione
router.post("/", rateLimit(5, 10 * 60 * 1000), optionalAuth, async (req: AuthRequest, res: Response) => {
  const { productId: rawId, nome, voto, testo } = req.body || {};
  if (isBot(req.body)) {
    res.status(201).json({ message: "Grazie per la tua recensione!" });
    return;
  }
  const productId = parseId(rawId);
  const rating = parseInt(voto, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: "Prodotto non valido" });
    return;
  }
  if (!(rating >= 1 && rating <= 5)) {
    res.status(400).json({ message: "Il voto deve essere da 1 a 5 stelle." });
    return;
  }
  if (!nome || String(nome).trim().length < 2) {
    res.status(400).json({ message: "Inserisci il tuo nome." });
    return;
  }
  try {
    await prisma.review.create({
      data: {
        productId,
        userId: req.user?.userId ?? null,
        nome: String(nome).trim().slice(0, 60),
        voto: rating,
        testo: testo ? String(testo).trim().slice(0, 2000) : null,
      },
    });
    res.status(201).json({
      message: "Grazie per la tua recensione! Sarà pubblicata dopo l'approvazione.",
    });
  } catch (error) {
    res.status(404).json({ message: "Prodotto non trovato" });
  }
});

// --- Admin: moderazione ---
const admin = [authenticateToken, authorizeRole(["ADMIN"]), noStore];

router.get("/", ...admin, async (req: Request, res: Response) => {
  const where =
    req.query.stato === "da-approvare" ? { approvata: false } : req.query.stato === "approvate" ? { approvata: true } : {};
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { id: true, titolo: true, immagine: true } } },
  });
  res.json(reviews);
});

router.patch("/:id", ...admin, async (req: Request, res: Response) => {
  const review = await prisma.review.update({
    where: { id: parseId(req.params.id) },
    data: { approvata: !!req.body?.approvata },
  });
  revalidateStorefront([`product:${review.productId}`]);
  res.json(review);
});

router.delete("/:id", ...admin, async (req: Request, res: Response) => {
  await prisma.review.deleteMany({ where: { id: parseId(req.params.id) } });
  res.json({ message: "Recensione eliminata" });
});

export default router;
