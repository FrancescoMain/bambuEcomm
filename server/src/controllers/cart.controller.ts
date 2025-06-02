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

// Ottenere il carrello dell'utente corrente
export const getCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      // Se l'utente non ha un carrello, potrebbe essere un nuovo utente o un errore.
      // Consideriamo di creare un carrello vuoto qui se non esiste,
      // anche se la logica di registrazione utente dovrebbe già averne creato uno.
      const newCart = await prisma.cart.create({
        data: { userId },
      });
      res.status(200).json(newCart);
      return;
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Errore durante il recupero del carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Aggiungere un prodotto al carrello
export const addItemToCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const { productId, quantity } = req.body;

    // Trova o crea il carrello dell'utente
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Controlla se il prodotto esiste ed è disponibile
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato." });
      return;
    }

    if (product.stock < quantity) {
      res.status(400).json({ message: "Quantità richiesta non disponibile." });
      return;
    }

    // Controlla se l'articolo è già nel carrello
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    if (existingCartItem) {
      // Aggiorna la quantità se l'articolo esiste già
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      // Crea un nuovo articolo nel carrello
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error(
      "Errore durante l'aggiunta dell'articolo al carrello:",
      error
    );
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Aggiornare la quantità di un articolo nel carrello
export const updateCartItemQuantity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Se la quantità è 0 o meno, rimuovi l'articolo
      await removeItemFromCartById(parseInt(cartItemId, 10), userId, res);
      return;
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(cartItemId, 10) },
      include: { cart: true, product: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      res
        .status(404)
        .json({
          message:
            "Articolo del carrello non trovato o non appartenente all'utente.",
        });
      return;
    }

    if (cartItem.product.stock < quantity) {
      res.status(400).json({ message: "Quantità richiesta non disponibile." });
      return;
    }

    await prisma.cartItem.update({
      where: { id: parseInt(cartItemId, 10) },
      data: { quantity },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    res.status(200).json(updatedCart);
  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento della quantità dell'articolo nel carrello:",
      error
    );
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Funzione helper per rimuovere l'articolo per ID, usata da updateCartItemQuantity e removeItemFromCart
const removeItemFromCartById = async (
  cartItemId: number,
  userId: number,
  res: Response
): Promise<void> => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.userId !== userId) {
    res
      .status(404)
      .json({
        message:
          "Articolo del carrello non trovato o non appartenente all'utente.",
      });
    return;
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
  res.status(200).json(updatedCart);
};

// Rimuovere un articolo dal carrello
export const removeItemFromCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const { cartItemId } = req.params;
    await removeItemFromCartById(parseInt(cartItemId, 10), userId, res);
  } catch (error) {
    console.error(
      "Errore durante la rimozione dell'articolo dal carrello:",
      error
    );
    // Evita di inviare una seconda risposta se removeItemFromCartById l'ha già fatto
    if (!res.headersSent) {
      res.status(500).json({ message: "Errore interno del server." });
    }
  }
};

// Svuotare il carrello
export const clearCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      res.status(404).json({ message: "Carrello non trovato." });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Errore durante lo svuotamento del carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};
