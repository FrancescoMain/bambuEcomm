import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getAllNotificationsAdmin,
  createNotificationAdmin,
} from "../controllers/notification.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { Role, NotificationType } from "@prisma/client";

const router = Router();

// Tutte le rotte per le notifiche utente richiedono l'autenticazione
router.use(authenticateToken);

// GET /api/notifications - Ottiene le notifiche dell'utente corrente
router.get("/", getUserNotifications);

// PATCH /api/notifications/read-all - Segna tutte le notifiche come lette
router.patch("/read-all", markAllNotificationsAsRead);

// PATCH /api/notifications/:notificationId/read - Segna una notifica specifica come letta
router.patch(
  "/:notificationId/read",
  param("notificationId")
    .isInt({ gt: 0 })
    .withMessage("ID notifica non valido."),
  markNotificationAsRead
);

// DELETE /api/notifications/:notificationId - Elimina una notifica specifica
router.delete(
  "/:notificationId",
  param("notificationId")
    .isInt({ gt: 0 })
    .withMessage("ID notifica non valido."),
  deleteNotification
);

// --- Rotte Admin ---
const adminNotificationValidationRules = [
  body("message")
    .notEmpty()
    .withMessage("Il messaggio della notifica è obbligatorio.")
    .trim(),
  body("type")
    .notEmpty()
    .withMessage("Il tipo di notifica è obbligatorio.")
    .isIn(Object.values(NotificationType))
    .withMessage("Tipo di notifica non valido."),
  body("userId")
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage("ID utente non valido."),
  body("relatedEntityType").optional().isString().trim(),
  body("relatedEntityId")
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 })
    .withMessage("ID entità correlata non valido."),
];

// GET /api/notifications/admin - Ottiene tutte le notifiche (Solo Admin)
router.get(
  "/admin",
  authorizeRole([Role.ADMIN]),
  [
    query("page")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Numero di pagina non valido."),
    query("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Limite per pagina non valido."),
    query("type")
      .optional()
      .isIn(Object.values(NotificationType))
      .withMessage("Tipo di notifica non valido."),
    query("isRead")
      .optional()
      .isBoolean()
      .withMessage("isRead deve essere un booleano."),
    query("userId")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("ID utente non valido."),
  ],
  getAllNotificationsAdmin
);

// POST /api/notifications/admin - Crea una notifica (Solo Admin)
router.post(
  "/admin",
  authorizeRole([Role.ADMIN]),
  adminNotificationValidationRules,
  createNotificationAdmin
);

export default router;
