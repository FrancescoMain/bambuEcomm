"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const address_controller_1 = require("../controllers/address.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Tutte le rotte per gli indirizzi richiedono autenticazione
router.use(auth_middleware_1.authenticateToken);
const addressValidationRules = [
    (0, express_validator_1.body)("street").notEmpty().withMessage("La via è obbligatoria.").trim(),
    (0, express_validator_1.body)("city").notEmpty().withMessage("La città è obbligatoria.").trim(),
    (0, express_validator_1.body)("postalCode")
        .notEmpty()
        .withMessage("Il codice postale è obbligatorio.")
        .trim(),
    (0, express_validator_1.body)("country").notEmpty().withMessage("La nazione è obbligatoria.").trim(),
    (0, express_validator_1.body)("isDefaultShipping")
        .optional()
        .isBoolean()
        .withMessage("isDefaultShipping deve essere un valore booleano."),
    (0, express_validator_1.body)("isDefaultBilling")
        .optional()
        .isBoolean()
        .withMessage("isDefaultBilling deve essere un valore booleano."),
];
// Creare un nuovo indirizzo
router.post("/", addressValidationRules, address_controller_1.createAddress);
// Ottenere tutti gli indirizzi dell'utente autenticato
router.get("/", address_controller_1.getUserAddresses);
// Ottenere, aggiornare o eliminare un indirizzo specifico
router.get("/:id", address_controller_1.getAddressById);
router.put("/:id", addressValidationRules, address_controller_1.updateAddress);
router.delete("/:id", address_controller_1.deleteAddress);
exports.default = router;
