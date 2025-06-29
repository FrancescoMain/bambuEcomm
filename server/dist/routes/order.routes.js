"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Middleware di autenticazione per tutte le rotte degli ordini
router.use(auth_middleware_1.authenticateToken);
// Creare un nuovo ordine
router.post("/", [
    (0, express_validator_1.body)("shippingAddressId")
        .isInt({ gt: 0 })
        .withMessage("ID indirizzo di spedizione non valido."),
    (0, express_validator_1.body)("billingAddressId")
        .isInt({ gt: 0 })
        .withMessage("ID indirizzo di fatturazione non valido."),
], order_controller_1.createOrder);
// Ottenere gli ordini dell'utente autenticato
router.get("/my-orders", order_controller_1.getUserOrders);
router.get("/user", order_controller_1.getUserOrders); // Endpoint alternativo per compatibilità
// Reclamare ordini guest con la propria email
router.post("/claim-guest-orders", order_controller_1.claimGuestOrders);
// Ottenere un ordine specifico per ID (utente proprietario o Admin)
router.get("/:id", order_controller_1.getOrderById);
// Cancellare un ordine (utente proprietario o Admin)
// L'utente può cancellare solo se lo stato lo permette (es. non spedito)
// L'admin ha più flessibilità
router.patch("/:id/cancel", order_controller_1.cancelOrder);
// --- Rotte solo per Admin ---
// Ottenere tutti gli ordini (Admin only)
router.get("/", (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), order_controller_1.getAllOrders);
// Aggiornare lo stato di un ordine (Admin only)
router.patch("/:id/status", (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), [
    (0, express_validator_1.body)("status")
        .isIn(Object.values(client_1.OrderStatus))
        .withMessage("Stato dell'ordine non valido."),
], order_controller_1.updateOrderStatus);
// Aggiornare il tracking number di un ordine (Admin only)
router.patch("/:id/tracking", (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), [
    (0, express_validator_1.body)("trackingNumber")
        .isString()
        .isLength({ min: 1 })
        .withMessage("Numero di tracking non valido."),
], order_controller_1.updateOrderTracking);
exports.default = router;
