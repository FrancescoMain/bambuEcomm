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
    minPrice,
    maxPrice,
    sortBy = "createdAt", // e.g., titolo, prezzo, createdAt
    sortOrder = "desc", // asc or desc
    search,
    stato,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const where: any = {};
  if (categoryId) {
    where.categoria = { some: { id: parseInt(categoryId as string) } };
  }
  if (minPrice || maxPrice) {
    where.prezzo = {};
    if (minPrice) {
      where.prezzo.gte = parseFloat(minPrice as string);
    }
    if (maxPrice) {
      where.prezzo.lte = parseFloat(maxPrice as string);
    }
  }
  if (search) {
    where.OR = [
      { titolo: { contains: search as string, mode: "insensitive" } },
      { descrizione: { contains: search as string, mode: "insensitive" } },
      { descrizioneBreve: { contains: search as string, mode: "insensitive" } },
      { codiceProdotto: { contains: search as string, mode: "insensitive" } },
      { codiceEAN: { contains: search as string, mode: "insensitive" } },
    ];
  }
  if (stato) {
    where.stato = stato as string;
  }

  const orderBy: any = {};
  const validSortByFields = ["titolo", "prezzo", "createdAt", "updatedAt"];
  if (validSortByFields.includes(sortBy as string)) {
    orderBy[sortBy as string] = sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const products = await prisma.product.findMany({
      skip: offset,
      take: limitNum,
      where,
      orderBy,
      include: { categoria: true },
    });
    const totalProducts = await prisma.product.count({ where });
    res.json({
      data: products,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      totalProducts,
    });
  } catch (error) {
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
      include: { categoria: true, orderItems: true, cartItems: true },
    });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    res.json(product);
  } catch (error) {
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
    codiceProdotto,
    codiceEAN,
    titolo,
    immagine,
    url,
    stock,
    descrizione,
    descrizioneBreve,
    stato,
    prezzo,
    categoriaId,
  } = req.body;
  if (
    !codiceProdotto ||
    !titolo ||
    prezzo === undefined ||
    stock === undefined ||
    categoriaId === undefined
  ) {
    res.status(400).json({
      message:
        "codiceProdotto, titolo, prezzo, stock e categoriaId sono obbligatori.",
    });
    return;
  }
  const parsedPrezzo = parseFloat(prezzo);
  const parsedStock = parseInt(stock, 10);
  const parsedCategoriaId = parseInt(categoriaId, 10);
  if (isNaN(parsedPrezzo) || isNaN(parsedStock) || isNaN(parsedCategoriaId)) {
    res
      .status(400)
      .json({ message: "Prezzo, stock o categoriaId non validi." });
    return;
  }
  try {
    const product = await prisma.product.create({
      data: {
        codiceProdotto,
        codiceEAN,
        titolo,
        immagine,
        url,
        stock: parsedStock,
        descrizione,
        descrizioneBreve,
        stato,
        prezzo: parsedPrezzo,
        categoria: {
          connect: { id: parsedCategoriaId },
        },
      },
      include: { categoria: true },
    });
    res.status(201).json({ message: "Prodotto creato con successo", product });
  } catch (error) {
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
          message: `ID categoria non valido o non esistente: ${parsedCategoriaId}`,
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
    codiceProdotto,
    codiceEAN,
    titolo,
    immagine,
    url,
    stock,
    descrizione,
    descrizioneBreve,
    stato,
    prezzo,
    categoriaId,
  } = req.body;
  try {
    const dataToUpdate: any = {};
    if (codiceProdotto !== undefined)
      dataToUpdate.codiceProdotto = codiceProdotto;
    if (codiceEAN !== undefined) dataToUpdate.codiceEAN = codiceEAN;
    if (titolo !== undefined) dataToUpdate.titolo = titolo;
    if (immagine !== undefined) dataToUpdate.immagine = immagine;
    if (url !== undefined) dataToUpdate.url = url;
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
    if (descrizione !== undefined) dataToUpdate.descrizione = descrizione;
    if (descrizioneBreve !== undefined)
      dataToUpdate.descrizioneBreve = descrizioneBreve;
    if (stato !== undefined) dataToUpdate.stato = stato;
    if (prezzo !== undefined) dataToUpdate.prezzo = parseFloat(prezzo);
    if (categoriaId !== undefined) {
      const parsedCategoriaId = parseInt(categoriaId, 10);
      if (isNaN(parsedCategoriaId)) {
        res.status(400).json({ message: "ID categoria non valido." });
        return;
      }
      dataToUpdate.categoria = { set: [{ id: parsedCategoriaId }] };
    }
    const product = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { categoria: true },
    });
    res.json({ message: "Prodotto aggiornato con successo", product });
  } catch (error) {
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
      if (error.code === "P2003" && categoriaId) {
        res.status(400).json({
          message: `ID categoria non valido o non esistente: ${categoriaId}`,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "Prodotto non trovato per l'eliminazione" });
        return;
      }
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
