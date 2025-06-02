import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

// Ottenere tutte le categorie
export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true }, // Opzionale: includere i prodotti per ogni categoria
    });
    res.json(categories);
  } catch (error) {
    console.error("Errore nel recupero delle categorie:", error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero delle categorie",
        error: (error as Error).message,
      });
  }
};

// Ottenere una singola categoria per ID
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    res.status(400).json({ message: "ID categoria non valido" });
    return;
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { products: true }, // Includere i prodotti associati
    });
    if (!category) {
      res.status(404).json({ message: "Categoria non trovata" });
      return;
    }
    res.json(category);
  } catch (error) {
    console.error(`Errore nel recupero della categoria ${id}:`, error);
    res
      .status(500)
      .json({
        message: "Errore nel recupero della categoria",
        error: (error as Error).message,
      });
  }
};

// Creare una nuova categoria (Admin only)
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, description } = req.body;

  if (!name) {
    res
      .status(400)
      .json({ message: "Il nome della categoria è obbligatorio." });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });
    res
      .status(201)
      .json({ message: "Categoria creata con successo", category });
  } catch (error) {
    console.error("Errore nella creazione della categoria:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res
          .status(409)
          .json({
            message: `Conflitto: la categoria con nome '${name}' esiste già.`,
          });
        return;
      }
    }
    res
      .status(500)
      .json({
        message: "Errore nella creazione della categoria",
        error: (error as Error).message,
      });
  }
};

// Aggiornare una categoria esistente (Admin only)
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    res.status(400).json({ message: "ID categoria non valido" });
    return;
  }

  const { name, description } = req.body;

  if (!name && description === undefined) {
    res
      .status(400)
      .json({
        message:
          "Almeno un campo (nome o descrizione) deve essere fornito per l'aggiornamento.",
      });
    return;
  }

  try {
    const dataToUpdate: Prisma.CategoryUpdateInput = {};
    if (name) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: dataToUpdate,
    });
    res.json({ message: "Categoria aggiornata con successo", category });
  } catch (error) {
    console.error(`Errore nell\'aggiornamento della categoria ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res
          .status(409)
          .json({
            message: `Conflitto: una categoria con nome '${name}' esiste già.`,
          });
        return;
      }
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "Categoria non trovata per l'aggiornamento" });
        return;
      }
    }
    res
      .status(500)
      .json({
        message: "Errore nell'aggiornamento della categoria",
        error: (error as Error).message,
      });
  }
};

// Eliminare una categoria (Admin only)
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    res.status(400).json({ message: "ID categoria non valido" });
    return;
  }

  try {
    // Opzionale: verificare se la categoria è utilizzata dai prodotti
    const productsInCategory = await prisma.product.count({
      where: { categories: { some: { id: categoryId } } },
    });

    if (productsInCategory > 0) {
      res.status(409).json({
        message: `Impossibile eliminare la categoria. ${productsInCategory} prodotti sono associati a questa categoria. Dissocia prima i prodotti.`,
      });
      return;
    }

    await prisma.category.delete({ where: { id: categoryId } });
    res.json({ message: "Categoria eliminata con successo" });
  } catch (error) {
    console.error(`Errore nell\'eliminazione della categoria ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "Categoria non trovata per l'eliminazione" });
        return;
      }
    }
    res
      .status(500)
      .json({
        message: "Errore nell'eliminazione della categoria",
        error: (error as Error).message,
      });
  }
};
