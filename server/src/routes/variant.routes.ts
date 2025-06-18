import { Router } from "express";
import { body } from "express-validator";
import {
  getVariantTypes,
  createVariantType,
  updateVariantType,
  deleteVariantType,
  createVariantValue,
  updateVariantValue,
  deleteVariantValue,
  uploadVariantValueImage,
} from "../controllers/variant.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { Role } from "@prisma/client";
import multer from "multer";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Regole di validazione per il tipo di variante
const variantTypeValidationRules = [
  body("nome").notEmpty().withMessage("Il nome del tipo è obbligatorio").trim(),
];

// Regole di validazione per il valore di variante
const variantValueValidationRules = [
  body("nome")
    .notEmpty()
    .withMessage("Il nome del valore è obbligatorio")
    .trim(),
  body("immagine").optional().isString().trim(),
];

// Endpoint per i tipi di variante di un prodotto
router.get("/product/:productId", getVariantTypes);

router.post(
  "/type/product/:productId",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  variantTypeValidationRules,
  createVariantType
);

router.put(
  "/type/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  variantTypeValidationRules,
  updateVariantType
);

router.delete(
  "/type/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  deleteVariantType
);

// Endpoint per i valori di variante
router.post(
  "/value/type/:typeId",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  variantValueValidationRules,
  createVariantValue
);

router.put(
  "/value/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  variantValueValidationRules,
  updateVariantValue
);

router.delete(
  "/value/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  deleteVariantValue
);

// Endpoint per il caricamento di immagini per valori di variante
router.post(
  "/value/upload-image",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  upload.single("image"),
  uploadVariantValueImage
);

export default router;
