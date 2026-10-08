import { Router, Request, Response } from "express";
import { body } from "express-validator";
import multer from "multer";
import streamifier from "streamifier";
import { Role } from "@prisma/client";
import {
  getAllProducts,
  getProductById,
  getProductFacets,
  getRelatedProducts,
  getBrands,
  suggestProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  setProductDiscount,
  bulkDiscount,
  bulkUpdate,
} from "../controllers/product.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import cloudinary from "../utils/cloudinary";
import { publicCache, noStore, rateLimit, isEmail, isBot, parseId } from "../lib/http";
import prisma from "../lib/prisma";

const router = Router();

const createProductValidationRules = [
  body("titolo").notEmpty().withMessage("Il titolo è obbligatorio").trim(),
  body("prezzo").isFloat({ gt: 0 }).withMessage("Il prezzo deve essere un numero positivo"),
  body("immagine").optional({ values: "null" }).isString().trim(),
  body("descrizione").optional({ values: "null" }).isString(),
  body("stock").optional().isInt({ min: 0 }).withMessage("Lo stock deve essere un intero >= 0"),
];

const updateProductValidationRules = [
  body("titolo")
    .optional()
    .notEmpty()
    .withMessage("Il titolo non può essere vuoto se fornito")
    .trim(),
  body("prezzo")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Il prezzo deve essere un numero positivo se fornito"),
  body("immagine").optional({ values: "null" }).isString().trim(),
  body("descrizione").optional({ values: "null" }).isString(),
  body("stock").optional().isInt({ min: 0 }).withMessage("Lo stock deve essere un intero >= 0"),
];

const adminOnly = [authenticateToken, authorizeRole([Role.ADMIN]), noStore];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// --- Lettura pubblica (in cache sulla CDN) ---
router.get("/", publicCache(60, 600), getAllProducts);
router.get("/facets", publicCache(120, 900), getProductFacets);
router.get("/suggest", publicCache(120, 900), suggestProducts);
router.get("/brands", publicCache(300, 3600), getBrands);
router.get("/:id/related", publicCache(300, 3600), getRelatedProducts);
router.get("/:id", publicCache(60, 600), getProductById);

// "Avvisami quando torna disponibile" — POST /api/products/:id/notify { email }
router.post("/:id/notify", rateLimit(10, 10 * 60 * 1000), async (req: Request, res: Response) => {
  const productId = parseId(req.params.id);
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (isBot(req.body)) {
    res.status(201).json({ message: "Ti avviseremo appena torna disponibile." });
    return;
  }
  if (isNaN(productId) || !isEmail(email)) {
    res.status(400).json({ message: "Inserisci un indirizzo email valido." });
    return;
  }
  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { available: true } });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    if (product.available) {
      res.status(409).json({ message: "Il prodotto è già disponibile: puoi acquistarlo subito!" });
      return;
    }
    await prisma.stockAlert.upsert({
      where: { email_productId: { email, productId } },
      create: { email, productId },
      update: { notifiedAt: null },
    });
    res.status(201).json({ message: "Perfetto! Ti scriveremo appena il prodotto torna disponibile." });
  } catch {
    res.status(404).json({ message: "Prodotto non trovato" });
  }
});

// --- Scrittura: solo ADMIN ---
// Richieste "avvisami" in attesa, raggruppate per prodotto
router.get("/stock-alerts/pending", ...adminOnly, async (req: Request, res: Response) => {
  const rows = await prisma.stockAlert.groupBy({
    by: ["productId"],
    where: { notifiedAt: null },
    _count: { _all: true },
  });
  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    select: { id: true, titolo: true, immagine: true, available: true },
  });
  res.json(
    rows
      .map((r) => ({ product: products.find((p) => p.id === r.productId), richieste: r._count._all }))
      .sort((a, b) => b.richieste - a.richieste)
  );
});

router.post("/", ...adminOnly, createProductValidationRules, createProduct);
router.post("/bulk-discount", ...adminOnly, bulkDiscount);
router.patch("/bulk", ...adminOnly, bulkUpdate);
router.put("/:id", ...adminOnly, updateProductValidationRules, updateProduct);
router.delete("/:id", ...adminOnly, deleteProduct);
router.patch("/:id/availability", ...adminOnly, toggleProductAvailability);
router.patch("/:id/discount", ...adminOnly, setProductDiscount);

// Upload immagini su Cloudinary (prima era pubblico: chiunque poteva caricare file)
router.post(
  "/upload-image",
  ...adminOnly,
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: "Nessun file inviato." });
      return;
    }
    if (!req.file.mimetype.startsWith("image/")) {
      res.status(400).json({ message: "Il file deve essere un'immagine." });
      return;
    }
    const folder =
      typeof req.body?.folder === "string" && /^[a-z-]+$/.test(req.body.folder)
        ? `bambu-ecomm/${req.body.folder}`
        : "bambu-ecomm/products";
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error || !result) {
        res.status(500).json({ message: "Errore upload Cloudinary" });
        return;
      }
      res.json({ url: result.secure_url });
    });
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  }
);

export default router;
