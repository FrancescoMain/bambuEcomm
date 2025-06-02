import { Router } from "express";
import { body, param } from "express-validator";
import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotion.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Validazioni comuni per la creazione e l'aggiornamento
const promotionValidationRules = [
  body("name")
    .notEmpty()
    .withMessage("Il nome della promozione è obbligatorio.")
    .trim(),
  body("description").optional().trim(),
  body("discountPercentage")
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0, max: 100 })
    .withMessage(
      "La percentuale di sconto deve essere un numero tra 0 (escluso) e 100."
    ),
  body("discountAmount")
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage("L'importo dello sconto deve essere un numero positivo."),
  body("startDate")
    .isISO8601()
    .toDate()
    .withMessage("La data di inizio non è valida."),
  body("endDate")
    .isISO8601()
    .toDate()
    .withMessage("La data di fine non è valida.")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error(
          "La data di fine deve essere successiva alla data di inizio."
        );
      }
      return true;
    }),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Il campo isActive deve essere un booleano."),
  body("code")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .toUpperCase()
    .withMessage("Il codice promozionale non è valido."),
  body("productIds")
    .optional()
    .isArray()
    .withMessage("productIds deve essere un array."),
  body("productIds.*")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("ID prodotto non valido in productIds."),
  body("categoryIds")
    .optional()
    .isArray()
    .withMessage("categoryIds deve essere un array."),
  body("categoryIds.*")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("ID categoria non valido in categoryIds."),
];

// POST /api/promotions - Crea una nuova promozione (Solo Admin)
router.post(
  "/",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  promotionValidationRules,
  createPromotion
);

// GET /api/promotions - Ottiene tutte le promozioni (Pubblico)
router.get("/", getAllPromotions);

// GET /api/promotions/:promotionId - Ottiene una promozione specifica (Pubblico)
router.get(
  "/:promotionId",
  param("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."),
  getPromotionById
);

// PUT /api/promotions/:promotionId - Aggiorna una promozione (Solo Admin)
router.put(
  "/:promotionId",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  param("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."),
  promotionValidationRules, // Riutilizza le regole, ma alcuni campi potrebbero essere opzionali nell'update
  updatePromotion
);

// DELETE /api/promotions/:promotionId - Elimina una promozione (Solo Admin)
router.delete(
  "/:promotionId",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  param("promotionId")
    .isInt({ gt: 0 })
    .withMessage("ID promozione non valido."),
  deletePromotion
);

export default router;
