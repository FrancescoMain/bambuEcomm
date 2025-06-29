"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Tutte le rotte del carrello richiedono l'autenticazione
router.use(auth_middleware_1.authenticateToken);
// GET /api/cart - Ottiene il carrello dell'utente corrente
router.get("/", cart_controller_1.getCart);
// POST /api/cart/items - Aggiunge un prodotto al carrello
router.post("/items", [
    (0, express_validator_1.body)("productId").isInt({ gt: 0 }).withMessage("ID prodotto non valido."),
    (0, express_validator_1.body)("quantity")
        .isInt({ gt: 0 })
        .withMessage("La quantità deve essere maggiore di zero."),
], cart_controller_1.addItemToCart);
// PUT /api/cart/items/:cartItemId - Aggiorna la quantità di un articolo nel carrello
router.put("/items/:cartItemId", [
    (0, express_validator_1.param)("cartItemId")
        .isInt({ gt: 0 })
        .withMessage("ID articolo carrello non valido."),
    (0, express_validator_1.body)("quantity")
        .isInt()
        .withMessage("La quantità deve essere un numero intero."), // Permette quantità 0 per la rimozione
], cart_controller_1.updateCartItemQuantity);
// DELETE /api/cart/items/:cartItemId - Rimuove un articolo dal carrello
router.delete("/items/:cartItemId", [
    (0, express_validator_1.param)("cartItemId")
        .isInt({ gt: 0 })
        .withMessage("ID articolo carrello non valido."),
], cart_controller_1.removeItemFromCart);
// DELETE /api/cart - Svuota il carrello dell'utente corrente
router.delete("/", cart_controller_1.clearCart);
// Endpoint pubblico per la pulizia dei carrelli vecchi (da chiamare da Vercel cron)
router.post("/cleanup", cart_controller_1.cleanupOldCarts);
exports.default = router;
