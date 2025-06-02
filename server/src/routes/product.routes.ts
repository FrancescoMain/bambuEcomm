import { Router } from "express";
import { body } from "express-validator";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Regole di validazione per la creazione del prodotto
const createProductValidationRules = [
  body("name").notEmpty().withMessage("Il nome è obbligatorio").trim(),
  body("description").optional().trim(),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Il prezzo deve essere un numero positivo"),
  body("stock")
    .isInt({ gt: -1 })
    .withMessage("Lo stock deve essere un numero intero non negativo"),
  body("categoryId")
    .isInt({ gt: 0 })
    .withMessage(
      "L'ID della categoria è obbligatorio e deve essere un intero positivo"
    ),
  body("imageUrl").optional().isURL().withMessage("URL immagine non valido"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured deve essere un booleano"),
  body("isBestSeller")
    .optional()
    .isBoolean()
    .withMessage("isBestSeller deve essere un booleano"),
];

// Regole di validazione per l'aggiornamento del prodotto (campi opzionali)
const updateProductValidationRules = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Il nome non può essere vuoto se fornito")
    .trim(),
  body("description").optional().trim(),
  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Il prezzo deve essere un numero positivo se fornito"),
  body("stock")
    .optional()
    .isInt({ gt: -1 })
    .withMessage(
      "Lo stock deve essere un numero intero non negativo se fornito"
    ),
  body("categoryId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "L'ID della categoria deve essere un intero positivo se fornito"
    ),
  body("imageUrl")
    .optional()
    .isURL()
    .withMessage("URL immagine non valido se fornito"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured deve essere un booleano se fornito"),
  body("isBestSeller")
    .optional()
    .isBoolean()
    .withMessage("isBestSeller deve essere un booleano se fornito"),
];

router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Solo ADMIN può creare, modificare o eliminare prodotti
router.post(
  "/",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  createProductValidationRules,
  createProduct
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  updateProductValidationRules,
  updateProduct
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  deleteProduct
);

export default router;
