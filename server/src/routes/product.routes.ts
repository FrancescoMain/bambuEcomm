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
  body("codiceProdotto")
    .notEmpty()
    .withMessage("Il codice prodotto è obbligatorio")
    .trim(),
  body("titolo").notEmpty().withMessage("Il titolo è obbligatorio").trim(),
  body("prezzo")
    .isFloat({ gt: 0 })
    .withMessage("Il prezzo deve essere un numero positivo"),
  body("stock")
    .isInt({ gt: -1 })
    .withMessage("Lo stock deve essere un numero intero non negativo"),
  body("categoriaId")
    .isInt({ gt: 0 })
    .withMessage(
      "L'ID della categoria è obbligatorio e deve essere un intero positivo"
    ),
  body("codiceEAN").optional().isString().trim(),
  body("immagine").optional().isString().trim(),
  body("url").optional().isString().trim(),
  body("descrizione").optional().isString().trim(),
  body("descrizioneBreve").optional().isString().trim(),
  body("stato").optional().isString().trim(),
];

// Regole di validazione per l'aggiornamento del prodotto (campi opzionali)
const updateProductValidationRules = [
  body("codiceProdotto")
    .optional()
    .notEmpty()
    .withMessage("Il codice prodotto non può essere vuoto se fornito")
    .trim(),
  body("titolo")
    .optional()
    .notEmpty()
    .withMessage("Il titolo non può essere vuoto se fornito")
    .trim(),
  body("prezzo")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Il prezzo deve essere un numero positivo se fornito"),
  body("stock")
    .optional()
    .isInt({ gt: -1 })
    .withMessage(
      "Lo stock deve essere un numero intero non negativo se fornito"
    ),
  body("categoriaId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage(
      "L'ID della categoria deve essere un intero positivo se fornito"
    ),
  body("codiceEAN").optional().isString().trim(),
  body("immagine").optional().isString().trim(),
  body("url").optional().isString().trim(),
  body("descrizione").optional().isString().trim(),
  body("descrizioneBreve").optional().isString().trim(),
  body("stato").optional().isString().trim(),
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
