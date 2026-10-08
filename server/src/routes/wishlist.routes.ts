import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";
import { noStore, parseId, parseIdList } from "../lib/http";
import { hydrateList } from "../lib/catalog";

// Lista desideri dei clienti registrati. Gli ospiti la tengono nel browser
// e al login viene unita a questa con POST /api/wishlist/merge.
const router = Router();
router.use(authenticateToken, noStore);

const listIds = async (userId: number) =>
  (
    await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    })
  ).map((w) => w.productId);

// GET /api/wishlist?details=true
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const ids = await listIds(req.user!.userId);
    if (req.query.details === "true") {
      res.json({ ids, products: await hydrateList(ids) });
      return;
    }
    res.json({ ids });
  } catch (error) {
    console.error("Errore wishlist:", error);
    res.status(500).json({ message: "Errore nel recupero della lista desideri" });
  }
});

// POST /api/wishlist { productId }
router.post("/", async (req: AuthRequest, res: Response) => {
  const productId = parseId(req.body?.productId);
  if (isNaN(productId)) {
    res.status(400).json({ message: "Prodotto non valido" });
    return;
  }
  try {
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.userId, productId } },
      create: { userId: req.user!.userId, productId },
      update: {},
    });
    res.json({ ids: await listIds(req.user!.userId) });
  } catch (error) {
    res.status(404).json({ message: "Prodotto non trovato" });
  }
});

// POST /api/wishlist/merge { productIds: [] } — unisce la lista dell'ospite
router.post("/merge", async (req: AuthRequest, res: Response) => {
  const ids = parseIdList(req.body?.productIds).slice(0, 200);
  try {
    if (ids.length) {
      const existing = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      await prisma.wishlistItem.createMany({
        data: existing.map((p) => ({ userId: req.user!.userId, productId: p.id })),
        skipDuplicates: true,
      });
    }
    res.json({ ids: await listIds(req.user!.userId) });
  } catch (error) {
    console.error("Errore merge wishlist:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento della lista desideri" });
  }
});

// DELETE /api/wishlist/:productId
router.delete("/:productId", async (req: AuthRequest, res: Response) => {
  const productId = parseId(req.params.productId);
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.userId, productId } });
    res.json({ ids: await listIds(req.user!.userId) });
  } catch (error) {
    res.status(500).json({ message: "Errore nell'aggiornamento della lista desideri" });
  }
});

export default router;
