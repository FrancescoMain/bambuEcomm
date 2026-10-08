import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { invalidateCategoryCache, slugify } from "../lib/catalog";
import { parseId, revalidateStorefront } from "../lib/http";

const categorySelect = {
  id: true,
  name: true,
  description: true,
  immagine: true,
  ordine: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true, children: true } },
} satisfies Prisma.CategorySelect;

type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

const serialize = (c: CategoryRow) => ({
  ...c,
  slug: slugify(c.name),
  productCount: c._count.products,
  childrenCount: c._count.children,
});

// GET /api/categories — lista piatta, leggera (prima includeva TUTTI i prodotti)
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      select: categorySelect,
      orderBy: [{ ordine: "asc" }, { name: "asc" }],
    });
    res.json(categories.map(serialize));
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
    res.status(500).json({ message: "Errore nel recupero delle categorie" });
  }
};

// GET /api/categories/:id — accetta id numerico o slug ("scuola")
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    let category: CategoryRow | null = null;
    const numericId = /^\d+$/.test(id) ? parseId(id) : NaN;
    if (!isNaN(numericId)) {
      category = await prisma.category.findUnique({ where: { id: numericId }, select: categorySelect });
    } else {
      const all = await prisma.category.findMany({ select: categorySelect });
      category = all.find((c) => slugify(c.name) === id.toLowerCase()) || null;
    }
    if (!category) {
      res.status(404).json({ message: "Categoria non trovata" });
      return;
    }
    const children = await prisma.category.findMany({
      where: { parentId: category.id },
      select: categorySelect,
      orderBy: [{ ordine: "asc" }, { name: "asc" }],
    });
    res.json({ ...serialize(category), children: children.map(serialize) });
  } catch (error) {
    console.error(`Errore nel recupero della categoria ${id}:`, error);
    res.status(500).json({ message: "Errore nel recupero della categoria" });
  }
};

const readCategoryData = (body: any) => {
  const data: Prisma.CategoryUncheckedUpdateInput = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description || null;
  if (body.immagine !== undefined) data.immagine = body.immagine || null;
  if (body.ordine !== undefined) data.ordine = parseInt(body.ordine, 10) || 0;
  if (body.parentId !== undefined) {
    const parentId = parseId(body.parentId);
    data.parentId = isNaN(parentId) ? null : parentId;
  }
  return data;
};

const afterCategoryChange = () => {
  invalidateCategoryCache();
  revalidateStorefront(["categories", "products"]);
};

// POST /api/categories (Admin)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const data = readCategoryData(req.body);
  if (!data.name) {
    res.status(400).json({ message: "Il nome della categoria è obbligatorio." });
    return;
  }
  try {
    const category = await prisma.category.create({
      data: data as Prisma.CategoryUncheckedCreateInput,
      select: categorySelect,
    });
    afterCategoryChange();
    res.status(201).json({ message: "Categoria creata con successo", category: serialize(category) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: `La categoria '${data.name}' esiste già.` });
      return;
    }
    console.error("Errore nella creazione della categoria:", error);
    res.status(500).json({ message: "Errore nella creazione della categoria" });
  }
};

// PUT /api/categories/:id (Admin)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const categoryId = parseId(req.params.id);
  if (isNaN(categoryId)) {
    res.status(400).json({ message: "ID categoria non valido" });
    return;
  }
  const data = readCategoryData(req.body);
  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "Nessun campo da aggiornare." });
    return;
  }
  if (data.parentId === categoryId) {
    res.status(400).json({ message: "Una categoria non può essere figlia di se stessa." });
    return;
  }
  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
      select: categorySelect,
    });
    afterCategoryChange();
    res.json({ message: "Categoria aggiornata con successo", category: serialize(category) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({ message: `Una categoria con nome '${data.name}' esiste già.` });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({ message: "Categoria non trovata per l'aggiornamento" });
        return;
      }
    }
    console.error("Errore nell'aggiornamento della categoria:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento della categoria" });
  }
};

// PATCH /api/categories/reorder (Admin) — body: { order: [{ id, ordine }] }
export const reorderCategories = async (req: Request, res: Response): Promise<void> => {
  const order = Array.isArray(req.body?.order) ? req.body.order : [];
  const updates = order
    .map((o: any) => ({ id: parseId(o.id), ordine: parseInt(o.ordine, 10) }))
    .filter((o: { id: number; ordine: number }) => !isNaN(o.id) && Number.isFinite(o.ordine));
  if (!updates.length) {
    res.status(400).json({ message: "Ordine non valido." });
    return;
  }
  try {
    await prisma.$transaction(
      updates.map((u: { id: number; ordine: number }) =>
        prisma.category.update({ where: { id: u.id }, data: { ordine: u.ordine } })
      )
    );
    afterCategoryChange();
    res.json({ message: "Ordine aggiornato" });
  } catch (error) {
    console.error("Errore riordino categorie:", error);
    res.status(500).json({ message: "Errore nel riordino delle categorie" });
  }
};

// DELETE /api/categories/:id (Admin)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = parseId(req.params.id);
  if (isNaN(categoryId)) {
    res.status(400).json({ message: "ID categoria non valido" });
    return;
  }
  try {
    const [productsInCategory, children] = await Promise.all([
      prisma.product.count({ where: { categoria: { some: { id: categoryId } } } }),
      prisma.category.count({ where: { parentId: categoryId } }),
    ]);
    if (productsInCategory > 0) {
      res.status(409).json({
        message: `Impossibile eliminare la categoria: ${productsInCategory} prodotti sono associati. Spostali prima in un'altra categoria.`,
      });
      return;
    }
    if (children > 0) {
      res.status(409).json({
        message: `Impossibile eliminare la categoria: contiene ${children} sottocategorie.`,
      });
      return;
    }
    await prisma.category.delete({ where: { id: categoryId } });
    afterCategoryChange();
    res.json({ message: "Categoria eliminata con successo" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: "Categoria non trovata per l'eliminazione" });
      return;
    }
    console.error("Errore nell'eliminazione della categoria:", error);
    res.status(500).json({ message: "Errore nell'eliminazione della categoria" });
  }
};
