import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

// Ottenere tutti i prodotti (con paginazione, filtri e ordinamento)
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    page = "1",
    limit = "10",
    categoryId,
    isFeatured,
    isBestSeller,
    minPrice,
    maxPrice,
    sortBy = "createdAt", // e.g., name, price, createdAt
    sortOrder = "desc", // asc or desc
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const where: Prisma.ProductWhereInput = {};
  if (categoryId) {
    where.categories = { some: { id: parseInt(categoryId as string) } };
  }
  if (isFeatured)
    where.isFeatured = (isFeatured as string).toLowerCase() === "true";
  if (isBestSeller)
    where.isBestSeller = (isBestSeller as string).toLowerCase() === "true";

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      (where.price as Prisma.DecimalFilter<"Product">).gte = parseFloat(
        minPrice as string
      );
    }
    if (maxPrice) {
      (where.price as Prisma.DecimalFilter<"Product">).lte = parseFloat(
        maxPrice as string
      );
    }
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  const validSortByFields: (keyof Prisma.ProductOrderByWithRelationInput)[] = [
    "name",
    "price",
    "createdAt",
    "updatedAt",
  ];

  if (
    validSortByFields.includes(
      sortBy as keyof Prisma.ProductOrderByWithRelationInput
    )
  ) {
    orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] =
      sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc"; // Default sort
  }

  try {
    const products = await prisma.product.findMany({
      skip: offset,
      take: limitNum,
      where,
      orderBy,
      include: { categories: true }, // Include category information
    });

    const totalProducts = await prisma.product.count({ where });

    res.json({
      data: products,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      totalProducts,
    });
  } catch (error) {
    console.error("Errore nel recupero dei prodotti:", error);
    res.status(500).json({
      message: "Errore nel recupero dei prodotti",
      error: (error as Error).message,
    });
  }
};

// Ottenere un singolo prodotto per ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true, orderItems: true, cartItems: true }, // Include related data
    });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error(`Errore nel recupero del prodotto ${id}:`, error);
    res.status(500).json({
      message: "Errore nel recupero del prodotto",
      error: (error as Error).message,
    });
  }
};

// Creare un nuovo prodotto (Admin only - protetto da middleware)
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const {
    name,
    description,
    price,
    stock,
    categoryId,
    imageUrl,
    isFeatured,
    isBestSeller,
  } = req.body;

  if (
    !name ||
    price === undefined ||
    stock === undefined ||
    categoryId === undefined
  ) {
    res.status(400).json({
      message: "Nome, prezzo, stock e ID categoria sono obbligatori.",
    });
    return;
  }

  const parsedPrice = parseFloat(price);
  const parsedStock = parseInt(stock, 10);
  const parsedCategoryId = parseInt(categoryId, 10);

  if (isNaN(parsedPrice) || isNaN(parsedStock) || isNaN(parsedCategoryId)) {
    res
      .status(400)
      .json({ message: "Prezzo, stock o ID categoria non validi." });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parsedPrice,
        stock: parsedStock,
        imageUrl,
        isFeatured: isFeatured || false,
        isBestSeller: isBestSeller || false,
        categories: {
          connect: { id: parsedCategoryId },
        },
      },
      include: { categories: true },
    });
    res.status(201).json({ message: "Prodotto creato con successo", product });
  } catch (error) {
    console.error("Errore nella creazione del prodotto:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res.status(409).json({
          message: `Conflitto: il campo ${
            Array.isArray(error.meta.target)
              ? error.meta.target.join(", ")
              : error.meta.target
          } deve essere univoco.`,
        });
        return;
      }
      if (error.code === "P2003") {
        res.status(400).json({
          message: `ID categoria non valido o non esistente: ${parsedCategoryId}`,
        });
        return;
      }
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "La categoria specificata non esiste." });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nella creazione del prodotto",
      error: (error as Error).message,
    });
  }
};

// Aggiornare un prodotto esistente (Admin only - protetto da middleware)
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }

  const {
    name,
    description,
    price,
    stock,
    categoryId,
    imageUrl,
    isFeatured,
    isBestSeller,
  } = req.body;

  try {
    const dataToUpdate: Prisma.ProductUpdateInput = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
    if (isFeatured !== undefined) dataToUpdate.isFeatured = isFeatured;
    if (isBestSeller !== undefined) dataToUpdate.isBestSeller = isBestSeller;

    if (categoryId !== undefined) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        res.status(400).json({ message: "ID categoria non valido." });
        return;
      }
      dataToUpdate.categories = { set: [{ id: parsedCategoryId }] }; // Sovrascrive le categorie esistenti
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { categories: true },
    });
    res.json({ message: "Prodotto aggiornato con successo", product });
  } catch (error) {
    console.error(`Errore nell'aggiornamento del prodotto ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res.status(409).json({
          message: `Conflitto: il campo ${
            Array.isArray(error.meta.target)
              ? error.meta.target.join(", ")
              : error.meta.target
          } deve essere univoco.`,
        });
        return;
      }
      if (error.code === "P2003" && categoryId) {
        res.status(400).json({
          message: `ID categoria non valido o non esistente: ${categoryId}`,
        });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({
          message: "Prodotto o categoria non trovato/a per l'aggiornamento",
        });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nell'aggiornamento del prodotto",
      error: (error as Error).message,
    });
  }
};

// Eliminare un prodotto (Admin only - protetto da middleware)
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }

  try {
    // Verifica se il prodotto esiste prima di tentare l'eliminazione
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }

    await prisma.product.delete({ where: { id: productId } });
    res.json({ message: "Prodotto eliminato con successo" });
  } catch (error) {
    console.error(`Errore nell'eliminazione del prodotto ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "Prodotto non trovato per l'eliminazione" });
        return;
      }
      // P2014: "The change you are trying to make would violate the required relation '{relation_name}' between the '{model_a_name}' and '{model_b_name}' models."
      // Questo errore può verificarsi se ci sono OrderItems o CartItems che referenziano questo prodotto.
      // Dovresti decidere come gestirlo: impedire l'eliminazione, o eliminare/annullare gli item correlati (con cautela).
      if (error.code === "P2014") {
        res.status(409).json({
          message:
            "Impossibile eliminare il prodotto. Esistono record correlati (es. ordini, carrelli) che lo referenziano.",
        });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nell'eliminazione del prodotto",
      error: (error as Error).message,
    });
  }
};
