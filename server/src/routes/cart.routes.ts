import { Router } from "express";
import { body, param } from "express-validator";
import {
  getCart,
  addItemToCart,
  mergeCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  quoteCart,
  cleanupOldCarts,
} from "../controllers/cart.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore, rateLimit } from "../lib/http";

const router = Router();
router.use(noStore);

// Pubblico: ricalcolo prezzi/sconti/spedizione di un carrello (anche ospite)
router.post("/quote", rateLimit(120, 60 * 1000), quoteCart);

// Pulizia carrelli inattivi (admin; il cron usa /api/cleanup-carts)
router.post("/cleanup", authenticateToken, authorizeRole(["ADMIN"]), cleanupOldCarts);

// Da qui in poi serve l'autenticazione
router.use(authenticateToken);

router.get("/", getCart);

router.post(
  "/items",
  [
    body("productId").isInt({ gt: 0 }).withMessage("ID prodotto non valido."),
    body("quantity").isInt({ gt: 0, lt: 100 }).withMessage("Quantità non valida."),
  ],
  addItemToCart
);

router.post("/merge", mergeCart);

router.put(
  "/items/:cartItemId",
  [
    param("cartItemId").isInt({ gt: 0 }).withMessage("ID articolo carrello non valido."),
    body("quantity").isInt({ min: 0, lt: 100 }).withMessage("Quantità non valida."),
  ],
  updateCartItemQuantity
);

router.delete(
  "/items/:cartItemId",
  [param("cartItemId").isInt({ gt: 0 }).withMessage("ID articolo carrello non valido.")],
  removeItemFromCart
);

router.delete("/", clearCart);

export default router;
