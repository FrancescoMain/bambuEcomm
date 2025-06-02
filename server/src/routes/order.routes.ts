import { Router } from "express";
import { body } from "express-validator";
import {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/order.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { OrderStatus, Role } from "@prisma/client";

const router = Router();

// Middleware di autenticazione per tutte le rotte degli ordini
router.use(authenticateToken);

// Creare un nuovo ordine
router.post(
  "/",
  [
    body("shippingAddressId")
      .isInt({ gt: 0 })
      .withMessage("ID indirizzo di spedizione non valido."),
    body("billingAddressId")
      .isInt({ gt: 0 })
      .withMessage("ID indirizzo di fatturazione non valido."),
  ],
  createOrder
);

// Ottenere gli ordini dell'utente autenticato
router.get("/my-orders", getUserOrders);

// Ottenere un ordine specifico per ID (utente proprietario o Admin)
router.get("/:id", getOrderById);

// Cancellare un ordine (utente proprietario o Admin)
// L'utente può cancellare solo se lo stato lo permette (es. non spedito)
// L'admin ha più flessibilità
router.patch("/:id/cancel", cancelOrder);

// --- Rotte solo per Admin ---

// Ottenere tutti gli ordini (Admin only)
router.get("/", authorizeRole([Role.ADMIN]), getAllOrders);

// Aggiornare lo stato di un ordine (Admin only)
router.patch(
  "/:id/status",
  authorizeRole([Role.ADMIN]),
  [
    body("status")
      .isIn(Object.values(OrderStatus))
      .withMessage("Stato dell'ordine non valido."),
  ],
  updateOrderStatus
);

export default router;
