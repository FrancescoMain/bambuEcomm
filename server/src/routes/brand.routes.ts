import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore, revalidateStorefront } from "../lib/http";
import { queryBrands, slugify } from "../lib/catalog";

// Schede delle marche (logo e descrizione) gestite dal pannello admin.
// L'elenco pubblico resta GET /api/products/brands.
const router = Router();
const admin = [authenticateToken, authorizeRole(["ADMIN"]), noStore];

// GET /api/brands — marche dei prodotti con la loro scheda (senza cache)
router.get("/", ...admin, async (req: Request, res: Response) => {
  try {
    res.json(await queryBrands());
  } catch (error) {
    console.error("Errore marche:", error);
    res.status(500).json({ message: "Errore nel recupero delle marche" });
  }
});

// PUT /api/brands/:slug — crea o aggiorna la scheda di una marca
router.put("/:slug", ...admin, async (req: Request, res: Response) => {
  const slug = slugify(String(req.params.slug || ""));
  const nome = typeof req.body?.nome === "string" ? req.body.nome.trim() : "";
  const logo = req.body?.logo;
  const descrizione = typeof req.body?.descrizione === "string" ? req.body.descrizione.trim() : "";
  if (!slug || !nome || slugify(nome) !== slug) {
    res.status(400).json({ message: "Marca non valida." });
    return;
  }
  if (logo !== null && logo !== undefined && (typeof logo !== "string" || !/^https:\/\//.test(logo))) {
    res.status(400).json({ message: "Il logo deve essere un'immagine caricata." });
    return;
  }
  if (descrizione.length > 2000) {
    res.status(400).json({ message: "La descrizione può avere al massimo 2000 caratteri." });
    return;
  }
  try {
    const data = { nome, logo: logo || null, descrizione: descrizione || null };
    const brand = await prisma.brand.upsert({ where: { slug }, create: { slug, ...data }, update: data });
    revalidateStorefront(["products"]);
    res.json(brand);
  } catch (error) {
    console.error("Errore salvataggio marca:", error);
    res.status(500).json({ message: "Non è stato possibile salvare la marca." });
  }
});

export default router;
