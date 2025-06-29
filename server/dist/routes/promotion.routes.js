"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const promotion_controller_1 = require("../controllers/promotion.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Validazioni comuni per la creazione e l'aggiornamento
const promotionValidationRules = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Il nome della promozione è obbligatorio.")
        .trim(),
    (0, express_validator_1.body)("description").optional().trim(),
    (0, express_validator_1.body)("discountPercentage")
        .optional({ checkFalsy: true })
        .isFloat({ gt: 0, max: 100 })
        .withMessage("La percentuale di sconto deve essere un numero tra 0 (escluso) e 100."),
    (0, express_validator_1.body)("discountAmount")
        .optional({ checkFalsy: true })
        .isFloat({ gt: 0 })
        .withMessage("L'importo dello sconto deve essere un numero positivo."),
    (0, express_validator_1.body)("startDate")
        .isISO8601()
        .toDate()
        .withMessage("La data di inizio non è valida."),
    (0, express_validator_1.body)("endDate")
        .isISO8601()
        .toDate()
        .withMessage("La data di fine non è valida.")
        .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error("La data di fine deve essere successiva alla data di inizio.");
        }
        return true;
    }),
    (0, express_validator_1.body)("isActive")
        .optional()
        .isBoolean()
        .withMessage("Il campo isActive deve essere un booleano."),
    (0, express_validator_1.body)("code")
        .optional({ checkFalsy: true })
        .isString()
        .trim()
        .toUpperCase()
        .withMessage("Il codice promozionale non è valido."),
    (0, express_validator_1.body)("productIds")
        .optional()
        .isArray()
        .withMessage("productIds deve essere un array."),
    (0, express_validator_1.body)("productIds.*")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("ID prodotto non valido in productIds."),
    (0, express_validator_1.body)("categoryIds")
        .optional()
        .isArray()
        .withMessage("categoryIds deve essere un array."),
    (0, express_validator_1.body)("categoryIds.*")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("ID categoria non valido in categoryIds."),
];
// POST /api/promotions - Crea una nuova promozione (Solo Admin)
router.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), promotionValidationRules, promotion_controller_1.createPromotion);
// GET /api/promotions - Ottiene tutte le promozioni (Pubblico)
router.get("/", promotion_controller_1.getAllPromotions);
// GET /api/promotions/:promotionId - Ottiene una promozione specifica (Pubblico)
router.get("/:promotionId", (0, express_validator_1.param)("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."), promotion_controller_1.getPromotionById);
// PUT /api/promotions/:promotionId - Aggiorna una promozione (Solo Admin)
router.put("/:promotionId", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), (0, express_validator_1.param)("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."), promotionValidationRules, // Riutilizza le regole, ma alcuni campi potrebbero essere opzionali nell'update
promotion_controller_1.updatePromotion);
// DELETE /api/promotions/:promotionId - Elimina una promozione (Solo Admin)
router.delete("/:promotionId", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), (0, express_validator_1.param)("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."), promotion_controller_1.deletePromotion);
exports.default = router;
