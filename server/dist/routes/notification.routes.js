"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Tutte le rotte per le notifiche utente richiedono l'autenticazione
router.use(auth_middleware_1.authenticateToken);
// GET /api/notifications - Ottiene le notifiche dell'utente corrente
router.get("/", notification_controller_1.getUserNotifications);
// PATCH /api/notifications/read-all - Segna tutte le notifiche come lette
router.patch("/read-all", notification_controller_1.markAllNotificationsAsRead);
// PATCH /api/notifications/:notificationId/read - Segna una notifica specifica come letta
router.patch("/:notificationId/read", (0, express_validator_1.param)("notificationId")
    .isInt({ gt: 0 })
    .withMessage("ID notifica non valido."), notification_controller_1.markNotificationAsRead);
// DELETE /api/notifications/:notificationId - Elimina una notifica specifica
router.delete("/:notificationId", (0, express_validator_1.param)("notificationId")
    .isInt({ gt: 0 })
    .withMessage("ID notifica non valido."), notification_controller_1.deleteNotification);
// --- Rotte Admin ---
const adminNotificationValidationRules = [
    (0, express_validator_1.body)("message")
        .notEmpty()
        .withMessage("Il messaggio della notifica è obbligatorio.")
        .trim(),
    (0, express_validator_1.body)("type")
        .notEmpty()
        .withMessage("Il tipo di notifica è obbligatorio.")
        .isIn(Object.values(client_1.NotificationType))
        .withMessage("Tipo di notifica non valido."),
    (0, express_validator_1.body)("userId")
        .optional({ checkFalsy: true })
        .isInt({ gt: 0 })
        .withMessage("ID utente non valido."),
    (0, express_validator_1.body)("relatedEntityType").optional().isString().trim(),
    (0, express_validator_1.body)("relatedEntityId")
        .optional({ checkFalsy: true })
        .isInt({ gt: 0 })
        .withMessage("ID entità correlata non valido."),
];
// GET /api/notifications/admin - Ottiene tutte le notifiche (Solo Admin)
router.get("/admin", (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("Numero di pagina non valido."),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("Limite per pagina non valido."),
    (0, express_validator_1.query)("type")
        .optional()
        .isIn(Object.values(client_1.NotificationType))
        .withMessage("Tipo di notifica non valido."),
    (0, express_validator_1.query)("isRead")
        .optional()
        .isBoolean()
        .withMessage("isRead deve essere un booleano."),
    (0, express_validator_1.query)("userId")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("ID utente non valido."),
], notification_controller_1.getAllNotificationsAdmin);
// POST /api/notifications/admin - Crea una notifica (Solo Admin)
router.post("/admin", (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), adminNotificationValidationRules, notification_controller_1.createNotificationAdmin);
exports.default = router;
