import { Request, Response } from "express";
import { PrismaClient, Prisma, Role } from "@prisma/client";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: Role;
  };
}

// Creare un nuovo indirizzo per l'utente autenticato
export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  const {
    street,
    city,
    postalCode,
    country,
    isDefaultShipping,
    isDefaultBilling,
  } = req.body;

  try {
    // Se il nuovo indirizzo è impostato come predefinito, imposta gli altri a false
    if (isDefaultShipping) {
      await prisma.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (isDefaultBilling) {
      await prisma.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        street,
        city,
        postalCode,
        country,
        isDefaultShipping: isDefaultShipping || false,
        isDefaultBilling: isDefaultBilling || false,
      },
    });
    res
      .status(201)
      .json({ message: "Indirizzo creato con successo.", address: newAddress });
    return;
  } catch (error) {
    console.error("Errore nella creazione dell'indirizzo:", error);
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante la creazione dell'indirizzo.",
        error: (error as Error).message,
      });
    return;
  }
};

// Ottenere tutti gli indirizzi per l'utente autenticato
export const getUserAddresses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(addresses);
    return;
  } catch (error) {
    console.error(
      `Errore nel recupero degli indirizzi per l'utente ${userId}:`,
      error
    );
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante il recupero degli indirizzi.",
        error: (error as Error).message,
      });
    return;
  }
};

// Ottenere un indirizzo specifico per ID (solo se appartiene all'utente autenticato)
export const getAddressById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const addressId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;

  if (isNaN(addressId)) {
    res.status(400).json({ message: "ID indirizzo non valido." });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      res
        .status(404)
        .json({
          message: "Indirizzo non trovato o non appartenente all'utente.",
        });
      return;
    }
    res.json(address);
    return;
  } catch (error) {
    console.error(`Errore nel recupero dell'indirizzo ${addressId}:`, error);
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante il recupero dell'indirizzo.",
        error: (error as Error).message,
      });
    return;
  }
};

// Aggiornare un indirizzo (solo se appartiene all'utente autenticato)
export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const addressId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;
  const {
    street,
    city,
    postalCode,
    country,
    isDefaultShipping,
    isDefaultBilling,
  } = req.body;

  if (isNaN(addressId)) {
    res.status(400).json({ message: "ID indirizzo non valido." });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      res
        .status(404)
        .json({
          message:
            "Indirizzo non trovato o non appartenente all'utente per l'aggiornamento.",
        });
      return;
    }

    // Se si imposta come predefinito, aggiorna gli altri
    if (isDefaultShipping === true && !address.isDefaultShipping) {
      await prisma.address.updateMany({
        where: { userId, isDefaultShipping: true, NOT: { id: addressId } },
        data: { isDefaultShipping: false },
      });
    }
    if (isDefaultBilling === true && !address.isDefaultBilling) {
      await prisma.address.updateMany({
        where: { userId, isDefaultBilling: true, NOT: { id: addressId } },
        data: { isDefaultBilling: false },
      });
    }

    const dataToUpdate: Prisma.AddressUpdateInput = {};
    if (street !== undefined) dataToUpdate.street = street;
    if (city !== undefined) dataToUpdate.city = city;
    if (postalCode !== undefined) dataToUpdate.postalCode = postalCode;
    if (country !== undefined) dataToUpdate.country = country;
    if (isDefaultShipping !== undefined)
      dataToUpdate.isDefaultShipping = isDefaultShipping;
    if (isDefaultBilling !== undefined)
      dataToUpdate.isDefaultBilling = isDefaultBilling;

    const updatedAddress = await prisma.address.update({
      where: { id: addressId }, // userId già verificato sopra
      data: dataToUpdate,
    });

    res.json({
      message: "Indirizzo aggiornato con successo.",
      address: updatedAddress,
    });
    return;
  } catch (error) {
    console.error(
      `Errore nell'aggiornamento dell'indirizzo ${addressId}:`,
      error
    );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res
        .status(404)
        .json({ message: "Indirizzo non trovato per l'aggiornamento." });
      return;
    }
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante l'aggiornamento dell'indirizzo.",
        error: (error as Error).message,
      });
    return;
  }
};

// Eliminare un indirizzo (solo se appartiene all'utente autenticato)
export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const addressId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;

  if (isNaN(addressId)) {
    res.status(400).json({ message: "ID indirizzo non valido." });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      res
        .status(404)
        .json({
          message:
            "Indirizzo non trovato o non appartenente all'utente per l'eliminazione.",
        });
      return;
    }

    // Verifica se l'indirizzo è usato in qualche ordine
    const ordersUsingAddress = await prisma.order.count({
      where: {
        OR: [{ shippingAddressId: addressId }, { billingAddressId: addressId }],
      },
    });

    if (ordersUsingAddress > 0) {
      res
        .status(409)
        .json({
          message:
            "Impossibile eliminare l'indirizzo perchè è utilizzato in uno o più ordini. Considera di disattivarlo o modificarlo.",
        });
      return;
    }

    await prisma.address.delete({
      where: { id: addressId }, // userId già verificato sopra
    });

    res.status(200).json({ message: "Indirizzo eliminato con successo." });
    return;
  } catch (error) {
    console.error(
      `Errore nell'eliminazione dell'indirizzo ${addressId}:`,
      error
    );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res
        .status(404)
        .json({ message: "Indirizzo non trovato per l'eliminazione." });
      return;
    }
    res
      .status(500)
      .json({
        message:
          "Errore interno del server durante l'eliminazione dell'indirizzo.",
        error: (error as Error).message,
      });
    return;
  }
};
