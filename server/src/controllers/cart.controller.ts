import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { validationResult } from "express-validator";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { parseId } from "../lib/http";
import {
  MAX_QTY,
  priceCart,
  variantKeyOf,
  cleanPersonalization,
  SelectedVariants,
} from "../lib/cartPricing";

/** Trova o crea il carrello dell'utente (upsert evita la doppia query). */
const ensureCart = (userId: number) =>
  prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });

/**
 * Restituisce il carrello con prezzi ricalcolati lato server.
 * `items[].cartItemId` serve al client per aggiornare/rimuovere le righe.
 */
const respondWithCart = async (userId: number, res: Response, status = 200) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productId: true,
          quantity: true,
          selectedVariants: true,
          variantKey: true,
          personalizzazione: true,
        },
      },
    },
  });
  const rows = cart?.items || [];
  const quote = await priceCart(
    rows.map((r) => ({
      productId: r.productId,
      quantity: r.quantity,
      selectedVariants: (r.selectedVariants as SelectedVariants | null) || null,
      personalizzazione: r.personalizzazione,
    }))
  );
  // Associa ad ogni riga prezzata l'id della riga nel database
  const items = quote.items.map((line) => {
    const row = rows.find(
      (r) =>
        r.productId === line.productId &&
        (r.variantKey === line.variantKey ||
          variantKeyOf(r.selectedVariants as SelectedVariants | null, r.personalizzazione) ===
            line.variantKey)
    );
    return { ...line, cartItemId: row?.id ?? null };
  });
  res.status(status).json({ id: cart?.id ?? null, ...quote, items });
};

// GET /api/cart
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await respondWithCart(req.user!.userId, res);
  } catch (error) {
    console.error("Errore durante il recupero del carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

const addLine = async (
  tx: Prisma.TransactionClient,
  cartId: number,
  productId: number,
  quantity: number,
  selectedVariants: SelectedVariants | null,
  personalizzazione: string | null
) => {
  const variantKey = variantKeyOf(selectedVariants, personalizzazione);
  const existing = await tx.cartItem.findUnique({
    where: { cartId_productId_variantKey: { cartId, productId, variantKey } },
    select: { id: true, quantity: true },
  });
  if (existing) {
    await tx.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(MAX_QTY, existing.quantity + quantity) },
    });
  } else {
    await tx.cartItem.create({
      data: {
        cartId,
        productId,
        quantity: Math.min(MAX_QTY, quantity),
        selectedVariants: (selectedVariants as Prisma.InputJsonValue) ?? Prisma.DbNull,
        variantKey,
        personalizzazione,
      },
    });
  }
};

// POST /api/cart/items { productId, quantity, selectedVariants }
export const addItemToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const userId = req.user!.userId;
    const productId = parseId(req.body.productId);
    const quantity = parseInt(req.body.quantity, 10);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { available: true, personalizzabile: true },
    });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato." });
      return;
    }
    if (!product.available) {
      res.status(400).json({ message: "Prodotto non disponibile per l'acquisto." });
      return;
    }
    const cart = await ensureCart(userId);
    await prisma.$transaction((tx) =>
      addLine(
        tx,
        cart.id,
        productId,
        quantity,
        req.body.selectedVariants || null,
        // salviamo il testo solo se il prodotto lo prevede (altrimenti la riga non combacia col ricalcolo)
        product.personalizzabile ? cleanPersonalization(req.body.personalizzazione) : null
      )
    );
    await respondWithCart(userId, res);
  } catch (error) {
    console.error("Errore durante l'aggiunta dell'articolo al carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// POST /api/cart/merge { items: [{ productId, quantity, selectedVariants }] }
// Unisce il carrello dell'ospite (localStorage) a quello dell'utente al login.
export const mergeCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const items: {
      productId: unknown;
      quantity: unknown;
      selectedVariants?: SelectedVariants;
      personalizzazione?: string;
    }[] =
      Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
    const ids = [...new Set(items.map((i) => parseId(i.productId)).filter((n) => !isNaN(n)))];
    const availableProducts = await prisma.product.findMany({
      where: { id: { in: ids }, available: true },
      select: { id: true, personalizzabile: true },
    });
    const available = new Set(availableProducts.map((p) => p.id));
    const personalizable = new Set(availableProducts.filter((p) => p.personalizzabile).map((p) => p.id));
    const cart = await ensureCart(userId);
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const productId = parseId(item.productId);
        const quantity = Math.max(1, parseInt(String(item.quantity), 10) || 1);
        if (available.has(productId)) {
          await addLine(
            tx,
            cart.id,
            productId,
            quantity,
            item.selectedVariants || null,
            personalizable.has(productId) ? cleanPersonalization(item.personalizzazione) : null
          );
        }
      }
    });
    await respondWithCart(userId, res);
  } catch (error) {
    console.error("Errore durante l'unione del carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

const findOwnedItem = (cartItemId: number, userId: number) =>
  prisma.cartItem.findFirst({ where: { id: cartItemId, cart: { userId } }, select: { id: true } });

// PUT /api/cart/items/:cartItemId { quantity } — quantità 0 = rimozione
export const updateCartItemQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const userId = req.user!.userId;
    const cartItemId = parseId(req.params.cartItemId);
    const quantity = parseInt(req.body.quantity, 10);
    const item = await findOwnedItem(cartItemId, userId);
    if (!item) {
      res.status(404).json({ message: "Articolo del carrello non trovato." });
      return;
    }
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: Math.min(MAX_QTY, quantity) },
      });
    }
    await respondWithCart(userId, res);
  } catch (error) {
    console.error("Errore durante l'aggiornamento della quantità:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// DELETE /api/cart/items/:cartItemId
export const removeItemFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cartItemId = parseId(req.params.cartItemId);
    const item = await findOwnedItem(cartItemId, userId);
    if (!item) {
      res.status(404).json({ message: "Articolo del carrello non trovato." });
      return;
    }
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    await respondWithCart(userId, res);
  } catch (error) {
    console.error("Errore durante la rimozione dell'articolo dal carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// DELETE /api/cart
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
    await respondWithCart(userId, res);
  } catch (error) {
    console.error("Errore durante lo svuotamento del carrello:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// POST /api/cart/quote { items, couponCode?, shippingMethod? } — pubblico
// Prezzi, sconti, spedizione e totale calcolati dal server per qualsiasi carrello.
export const quoteCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const quote = await priceCart(req.body?.items || [], {
      couponCode: req.body?.couponCode || null,
      shippingMethod: req.body?.shippingMethod,
      paymentMethod: req.body?.paymentMethod,
      cap: req.body?.cap || null,
    });
    res.json(quote);
  } catch (error) {
    console.error("Errore nel calcolo del carrello:", error);
    res.status(500).json({ message: "Errore nel calcolo del carrello." });
  }
};

// Svuota i carrelli non modificati da più di 48 ore (cron)
export const cleanupOldCarts = async (req: Request, res: Response): Promise<void> => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const deleted = await prisma.cartItem.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    res.status(200).json({ message: `Rimossi ${deleted.count} articoli da carrelli inattivi.` });
  } catch (error) {
    console.error("Errore durante la pulizia dei carrelli vecchi:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};
