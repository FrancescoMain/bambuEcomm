import { Router } from "express";
import { body, param } from "express-validator";
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
} from "../controllers/cart.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Tutte le rotte del carrello richiedono l'autenticazione
router.use(authenticateToken);

// GET /api/cart - Ottiene il carrello dell'utente corrente
router.get("/", getCart);

// POST /api/cart/items - Aggiunge un prodotto al carrello
router.post(
  "/items",
  [
    body("productId").isInt({ gt: 0 }).withMessage("ID prodotto non valido."),
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("La quantità deve essere maggiore di zero."),
  ],
  addItemToCart
);

// PUT /api/cart/items/:cartItemId - Aggiorna la quantità di un articolo nel carrello
router.put(
  "/items/:cartItemId",
  [
    param("cartItemId")
      .isInt({ gt: 0 })
      .withMessage("ID articolo carrello non valido."),
    body("quantity")
      .isInt()
      .withMessage("La quantità deve essere un numero intero."), // Permette quantità 0 per la rimozione
  ],
  updateCartItemQuantity
);

// DELETE /api/cart/items/:cartItemId - Rimuove un articolo dal carrello
router.delete(
  "/items/:cartItemId",
  [
    param("cartItemId")
      .isInt({ gt: 0 })
      .withMessage("ID articolo carrello non valido."),
  ],
  removeItemFromCart
);

// DELETE /api/cart - Svuota il carrello dell'utente corrente
router.delete("/", clearCart);

export default router;
