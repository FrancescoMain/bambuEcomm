"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const variant_controller_1 = require("../controllers/variant.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Regole di validazione per il tipo di variante
const variantTypeValidationRules = [
    (0, express_validator_1.body)("nome").notEmpty().withMessage("Il nome del tipo è obbligatorio").trim(),
];
// Regole di validazione per il valore di variante
const variantValueValidationRules = [
    (0, express_validator_1.body)("nome")
        .notEmpty()
        .withMessage("Il nome del valore è obbligatorio")
        .trim(),
    (0, express_validator_1.body)("immagine").optional().isString().trim(),
];
// Endpoint per i tipi di variante di un prodotto
router.get("/product/:productId", variant_controller_1.getVariantTypes);
router.post("/type/product/:productId", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variantTypeValidationRules, variant_controller_1.createVariantType);
router.put("/type/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variantTypeValidationRules, variant_controller_1.updateVariantType);
router.delete("/type/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variant_controller_1.deleteVariantType);
// Endpoint per i valori di variante
router.post("/value/type/:typeId", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variantValueValidationRules, variant_controller_1.createVariantValue);
router.put("/value/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variantValueValidationRules, variant_controller_1.updateVariantValue);
router.delete("/value/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), variant_controller_1.deleteVariantValue);
// Endpoint per il caricamento di immagini per valori di variante
router.post("/value/upload-image", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), upload.single("image"), variant_controller_1.uploadVariantValueImage);
exports.default = router;
