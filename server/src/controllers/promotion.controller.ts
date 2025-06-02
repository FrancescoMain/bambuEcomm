import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: Role;
  };
}

// TODO: Implementare la logica del controller per le promozioni
// Creare una nuova promozione (solo ADMIN)
export const createPromotion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (req.user?.role !== Role.ADMIN) {
    res
      .status(403)
      .json({
        message:
          "Accesso negato. Solo gli amministratori possono creare promozioni.",
      });
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const {
    name,
    description,
    discountPercentage,
    discountAmount,
    startDate,
    endDate,
    isActive,
    code,
    productIds, // Array di ID prodotto
    categoryIds, // Array di ID categoria
  } = req.body;

  // Validazione: o discountPercentage o discountAmount, non entrambi, non nessuno se non è un codice generico
  if (
    (discountPercentage && discountAmount) ||
    (!discountPercentage && !discountAmount)
  ) {
    res
      .status(400)
      .json({
        message:
          "Specificare un valore per discountPercentage o discountAmount, ma non entrambi.",
      });
    return;
  }
  if (
    discountPercentage &&
    (Number(discountPercentage) <= 0 || Number(discountPercentage) > 100)
  ) {
    res
      .status(400)
      .json({ message: "La percentuale di sconto deve essere tra 0 e 100." });
    return;
  }
  if (discountAmount && Number(discountAmount) <= 0) {
    res
      .status(400)
      .json({ message: "L'importo dello sconto deve essere positivo." });
    return;
  }

  try {
    const newPromotion = await prisma.promotion.create({
      data: {
        name,
        description,
        discountPercentage: discountPercentage
          ? parseFloat(discountPercentage)
          : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        code,
        products:
          productIds && productIds.length > 0
            ? {
                connect: productIds.map((id: number) => ({ id })),
              }
            : undefined,
        categories:
          categoryIds && categoryIds.length > 0
            ? {
                connect: categoryIds.map((id: number) => ({ id })),
              }
            : undefined,
      },
      include: {
        products: true,
        categories: true,
      },
    });
    res.status(201).json(newPromotion);
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      res
        .status(400)
        .json({ message: "Un codice promozione con questo nome esiste già." });
      return;
    }
    console.error("Errore durante la creazione della promozione:", error);
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante la creazione della promozione.",
      });
  }
};

// Ottenere tutte le promozioni (pubblico / ADMIN con più dettagli?)
// Per ora, pubblico. Si possono aggiungere filtri per isActive, date, etc.
export const getAllPromotions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(), // Mostra solo promozioni non scadute
        },
      },
      include: {
        products: { select: { id: true, name: true } }, // Includi solo info essenziali
        categories: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(promotions);
  } catch (error) {
    console.error("Errore durante il recupero delle promozioni:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Ottenere una promozione specifica per ID (pubblico)
export const getPromotionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { promotionId } = req.params;
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: parseInt(promotionId, 10) },
      include: {
        products: true,
        categories: true,
      },
    });

    if (!promotion) {
      res.status(404).json({ message: "Promozione non trovata." });
      return;
    }
    // Potresti voler controllare isActive e endDate anche qui se la vuoi nascondere se non attiva/scaduta
    // if (!promotion.isActive || new Date(promotion.endDate) < new Date()) {
    //   res.status(404).json({ message: "Promozione non disponibile." });
    //   return;
    // }
    res.status(200).json(promotion);
  } catch (error) {
    console.error("Errore durante il recupero della promozione:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Aggiornare una promozione (solo ADMIN)
export const updatePromotion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (req.user?.role !== Role.ADMIN) {
    res
      .status(403)
      .json({
        message:
          "Accesso negato. Solo gli amministratori possono aggiornare le promozioni.",
      });
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { promotionId } = req.params;
  const {
    name,
    description,
    discountPercentage,
    discountAmount,
    startDate,
    endDate,
    isActive,
    code,
    productIds, // Array di ID prodotto
    categoryIds, // Array di ID categoria
  } = req.body;

  // Validazione: o discountPercentage o discountAmount, non entrambi, non nessuno se non è un codice generico
  if (
    discountPercentage !== undefined &&
    discountAmount !== undefined &&
    discountPercentage !== null &&
    discountAmount !== null
  ) {
    if (discountPercentage && discountAmount) {
      res
        .status(400)
        .json({
          message:
            "Specificare un valore per discountPercentage o discountAmount, ma non entrambi.",
        });
      return;
    }
  } else if (discountPercentage === undefined && discountAmount === undefined) {
    // Permetti di non specificarli se si aggiornano altri campi
  } else if (discountPercentage === null && discountAmount === null) {
    res
      .status(400)
      .json({
        message:
          "Specificare un valore per discountPercentage o discountAmount, ma non entrambi.",
      });
    return;
  }

  if (
    discountPercentage &&
    (Number(discountPercentage) <= 0 || Number(discountPercentage) > 100)
  ) {
    res
      .status(400)
      .json({ message: "La percentuale di sconto deve essere tra 0 e 100." });
    return;
  }
  if (discountAmount && Number(discountAmount) <= 0) {
    res
      .status(400)
      .json({ message: "L'importo dello sconto deve essere positivo." });
    return;
  }

  try {
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: parseInt(promotionId, 10) },
    });

    if (!existingPromotion) {
      res.status(404).json({ message: "Promozione non trovata." });
      return;
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id: parseInt(promotionId, 10) },
      data: {
        name,
        description,
        discountPercentage: discountPercentage
          ? parseFloat(discountPercentage)
          : discountPercentage === null
          ? null
          : existingPromotion.discountPercentage,
        discountAmount: discountAmount
          ? parseFloat(discountAmount)
          : discountAmount === null
          ? null
          : existingPromotion.discountAmount,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        code,
        products: productIds
          ? {
              set: productIds.map((id: number) => ({ id })), // Sovrascrive le associazioni esistenti
            }
          : undefined,
        categories: categoryIds
          ? {
              set: categoryIds.map((id: number) => ({ id })), // Sovrascrive le associazioni esistenti
            }
          : undefined,
      },
      include: {
        products: true,
        categories: true,
      },
    });
    res.status(200).json(updatedPromotion);
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("code")) {
      res
        .status(400)
        .json({ message: "Un codice promozione con questo nome esiste già." });
      return;
    }
    console.error("Errore durante l'aggiornamento della promozione:", error);
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante l'aggiornamento della promozione.",
      });
  }
};

// Eliminare una promozione (solo ADMIN)
export const deletePromotion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (req.user?.role !== Role.ADMIN) {
    res
      .status(403)
      .json({
        message:
          "Accesso negato. Solo gli amministratori possono eliminare le promozioni.",
      });
    return;
  }

  const { promotionId } = req.params;

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: parseInt(promotionId, 10) },
    });

    if (!promotion) {
      res.status(404).json({ message: "Promozione non trovata." });
      return;
    }

    // Prima di eliminare, scollega prodotti e categorie per evitare errori di constraint
    // Prisma gestisce questo automaticamente se le relazioni sono definite correttamente,
    // ma è buona pratica essere espliciti o assicurarsi che il DB lo faccia (onDelete cascade etc.)
    // In questo caso, la relazione è many-to-many, quindi Prisma dovrebbe gestire la rimozione
    // dalle tabelle di join.

    await prisma.promotion.delete({
      where: { id: parseInt(promotionId, 10) },
    });

    res.status(200).json({ message: "Promozione eliminata con successo." });
  } catch (error: any) {
    if (error.code === "P2025") {
      res
        .status(404)
        .json({ message: "Promozione non trovata o già eliminata." });
      return;
    }
    console.error("Errore durante l'eliminazione della promozione:", error);
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante l'eliminazione della promozione.",
      });
  }
};

// TODO: Potrebbe essere utile una funzione per applicare/rimuovere promozioni a prodotti/categorie (ADMIN)
// Questa logica è parzialmente coperta da create/update, ma potrebbero esserci casi d'uso per modifiche granulari.
