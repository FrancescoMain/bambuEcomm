import { Router } from "express";
import { body } from "express-validator";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Tutte le rotte per gli indirizzi richiedono autenticazione
router.use(authenticateToken);

const addressValidationRules = [
  body("street").notEmpty().withMessage("La via è obbligatoria.").trim(),
  body("city").notEmpty().withMessage("La città è obbligatoria.").trim(),
  body("postalCode")
    .notEmpty()
    .withMessage("Il codice postale è obbligatorio.")
    .trim(),
  body("country").notEmpty().withMessage("La nazione è obbligatoria.").trim(),
  body("isDefaultShipping")
    .optional()
    .isBoolean()
    .withMessage("isDefaultShipping deve essere un valore booleano."),
  body("isDefaultBilling")
    .optional()
    .isBoolean()
    .withMessage("isDefaultBilling deve essere un valore booleano."),
];

// Creare un nuovo indirizzo
router.post("/", addressValidationRules, createAddress);

// Ottenere tutti gli indirizzi dell'utente autenticato
router.get("/", getUserAddresses);

// Ottenere, aggiornare o eliminare un indirizzo specifico
router.get("/:id", getAddressById);
router.put("/:id", addressValidationRules, updateAddress);
router.delete("/:id", deleteAddress);

export default router;
