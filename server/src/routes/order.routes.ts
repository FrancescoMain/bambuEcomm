import { Router } from "express";
import { body } from "express-validator";
import { OrderStatus, Role } from "@prisma/client";
import {
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderTracking,
  cancelOrder,
  claimGuestOrders,
  requestGuestOrdersClaim,
} from "../controllers/order.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { noStore, rateLimit } from "../lib/http";

const router = Router();

// Tutte le rotte degli ordini richiedono l'autenticazione
router.use(authenticateToken, noStore);

// Ordini dell'utente autenticato
router.get("/my-orders", getUserOrders);
router.get("/user", getUserOrders); // alias per compatibilità

// Ordini fatti da ospite: prima si chiede il link via email, poi lo si conferma
router.post("/claim-guest-orders/request", rateLimit(5, 60 * 60 * 1000), requestGuestOrdersClaim);
router.post("/claim-guest-orders", claimGuestOrders);

// --- Solo admin ---
router.get("/", authorizeRole([Role.ADMIN]), getAllOrders);
router.patch(
  "/:id/status",
  authorizeRole([Role.ADMIN]),
  [body("status").isIn(Object.values(OrderStatus)).withMessage("Stato dell'ordine non valido.")],
  updateOrderStatus
);
router.patch(
  "/:id/tracking",
  authorizeRole([Role.ADMIN]),
  [body("trackingNumber").isString().isLength({ max: 100 }).withMessage("Numero di tracking non valido.")],
  updateOrderTracking
);

// Proprietario o admin
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

export default router;
