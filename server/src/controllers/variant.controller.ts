import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { validationResult } from "express-validator";
import cloudinary from "../utils/cloudinary";
import streamifier from "streamifier";

const prisma = new PrismaClient();

// Ottenere tutti i tipi di variante per un prodotto
export const getVariantTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { productId } = req.params;
  const parsedProductId = parseInt(productId, 10);

  if (isNaN(parsedProductId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }

  try {
    const variantTypes = await prisma.productVariantType.findMany({
      where: { productId: parsedProductId },
      include: { valori: true },
    });

    res.json(variantTypes);
  } catch (error) {
    res.status(500).json({
      message: "Errore nel recupero dei tipi di variante",
      error: (error as Error).message,
    });
  }
};

// Creare un nuovo tipo di variante
export const createVariantType = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { productId } = req.params;
  const { nome } = req.body;

  const parsedProductId = parseInt(productId, 10);

  if (isNaN(parsedProductId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }

  if (!nome) {
    res
      .status(400)
      .json({ message: "Il nome del tipo di variante è obbligatorio" });
    return;
  }

  try {
    // Verifica che il prodotto esista
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
    });

    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }

    const variantType = await prisma.productVariantType.create({
      data: {
        nome,
        productId: parsedProductId,
      },
      include: { valori: true },
    });

    res.status(201).json({
      message: "Tipo di variante creato con successo",
      variantType,
    });
  } catch (error) {
    res.status(500).json({
      message: "Errore nella creazione del tipo di variante",
      error: (error as Error).message,
    });
  }
};

// Aggiornare un tipo di variante
export const updateVariantType = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;
  const { nome } = req.body;

  const variantTypeId = parseInt(id, 10);

  if (isNaN(variantTypeId)) {
    res.status(400).json({ message: "ID tipo di variante non valido" });
    return;
  }

  if (!nome) {
    res
      .status(400)
      .json({ message: "Il nome del tipo di variante è obbligatorio" });
    return;
  }

  try {
    const variantType = await prisma.productVariantType.update({
      where: { id: variantTypeId },
      data: { nome },
      include: { valori: true },
    });

    res.json({
      message: "Tipo di variante aggiornato con successo",
      variantType,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ message: "Tipo di variante non trovato" });
        return;
      }
    }

    res.status(500).json({
      message: "Errore nell'aggiornamento del tipo di variante",
      error: (error as Error).message,
    });
  }
};

// Eliminare un tipo di variante
export const deleteVariantType = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const variantTypeId = parseInt(id, 10);

  if (isNaN(variantTypeId)) {
    res.status(400).json({ message: "ID tipo di variante non valido" });
    return;
  }

  try {
    // Prima eliminiamo tutti i valori di variante associati
    await prisma.productVariantValue.deleteMany({
      where: { typeId: variantTypeId },
    });

    // Poi eliminiamo il tipo di variante
    await prisma.productVariantType.delete({
      where: { id: variantTypeId },
    });

    res.json({ message: "Tipo di variante eliminato con successo" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ message: "Tipo di variante non trovato" });
        return;
      }
    }

    res.status(500).json({
      message: "Errore nell'eliminazione del tipo di variante",
      error: (error as Error).message,
    });
  }
};

// Creare un nuovo valore di variante
export const createVariantValue = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { typeId } = req.params;
  const { nome, immagine } = req.body;

  const parsedTypeId = parseInt(typeId, 10);

  if (isNaN(parsedTypeId)) {
    res.status(400).json({ message: "ID tipo di variante non valido" });
    return;
  }

  if (!nome) {
    res
      .status(400)
      .json({ message: "Il nome del valore di variante è obbligatorio" });
    return;
  }

  try {
    // Verifica che il tipo di variante esista
    const variantType = await prisma.productVariantType.findUnique({
      where: { id: parsedTypeId },
    });

    if (!variantType) {
      res.status(404).json({ message: "Tipo di variante non trovato" });
      return;
    }

    const variantValue = await prisma.productVariantValue.create({
      data: {
        nome,
        immagine,
        typeId: parsedTypeId,
      },
    });

    res.status(201).json({
      message: "Valore di variante creato con successo",
      variantValue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Errore nella creazione del valore di variante",
      error: (error as Error).message,
    });
  }
};

// Aggiornare un valore di variante
export const updateVariantValue = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;
  const { nome, immagine } = req.body;

  const variantValueId = parseInt(id, 10);

  if (isNaN(variantValueId)) {
    res.status(400).json({ message: "ID valore di variante non valido" });
    return;
  }

  if (!nome) {
    res
      .status(400)
      .json({ message: "Il nome del valore di variante è obbligatorio" });
    return;
  }

  try {
    const variantValue = await prisma.productVariantValue.update({
      where: { id: variantValueId },
      data: { nome, immagine },
    });

    res.json({
      message: "Valore di variante aggiornato con successo",
      variantValue,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ message: "Valore di variante non trovato" });
        return;
      }
    }

    res.status(500).json({
      message: "Errore nell'aggiornamento del valore di variante",
      error: (error as Error).message,
    });
  }
};

// Eliminare un valore di variante
export const deleteVariantValue = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const variantValueId = parseInt(id, 10);

  if (isNaN(variantValueId)) {
    res.status(400).json({ message: "ID valore di variante non valido" });
    return;
  }

  try {
    await prisma.productVariantValue.delete({
      where: { id: variantValueId },
    });

    res.json({ message: "Valore di variante eliminato con successo" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ message: "Valore di variante non trovato" });
        return;
      }
    }

    res.status(500).json({
      message: "Errore nell'eliminazione del valore di variante",
      error: (error as Error).message,
    });
  }
};

// Caricare un'immagine per un valore di variante
export const uploadVariantValueImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: "Nessun file inviato." });
    return;
  }

  try {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "bambu-ecomm/variants" },
        (error: any, result: any) => {
          if (error || !result) {
            reject(error || new Error("Errore upload Cloudinary"));
            return;
          }
          resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(req.file!.buffer).pipe(stream);
    });

    const imageUrl = await uploadPromise;
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({
      message: "Errore nell'upload dell'immagine",
      error: (error as Error).message,
    });
  }
};
