"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
const router = (0, express_1.Router)();
// Regole di validazione per la creazione del prodotto
const createProductValidationRules = [
    (0, express_validator_1.body)("titolo").notEmpty().withMessage("Il titolo è obbligatorio").trim(),
    (0, express_validator_1.body)("prezzo")
        .isFloat({ gt: 0 })
        .withMessage("Il prezzo deve essere un numero positivo"),
    (0, express_validator_1.body)("categoriaId")
        .isInt({ gt: 0 })
        .withMessage("L'ID della categoria è obbligatorio e deve essere un intero positivo"),
    (0, express_validator_1.body)("immagine").optional().isString().trim(),
    (0, express_validator_1.body)("descrizione").optional().isString().trim(),
    (0, express_validator_1.body)("stock")
        .isInt({ min: 0 })
        .withMessage("Lo stock è obbligatorio e deve essere un intero >= 0"),
];
// Regole di validazione per l'aggiornamento del prodotto (campi opzionali)
const updateProductValidationRules = [
    (0, express_validator_1.body)("titolo")
        .optional()
        .notEmpty()
        .withMessage("Il titolo non può essere vuoto se fornito")
        .trim(),
    (0, express_validator_1.body)("prezzo")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Il prezzo deve essere un numero positivo se fornito"),
    (0, express_validator_1.body)("categoriaId")
        .optional()
        .isInt({ gt: 0 })
        .withMessage("L'ID della categoria deve essere un intero positivo se fornito"),
    (0, express_validator_1.body)("immagine").optional().isString().trim(),
    (0, express_validator_1.body)("descrizione").optional().isString().trim(),
    (0, express_validator_1.body)("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Lo stock deve essere un intero >= 0 se fornito"),
];
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.get("/", product_controller_1.getAllProducts);
router.get("/:id", product_controller_1.getProductById);
// Solo ADMIN può creare, modificare o eliminare prodotti
router.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), createProductValidationRules, product_controller_1.createProduct);
router.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), updateProductValidationRules, product_controller_1.updateProduct);
router.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), product_controller_1.deleteProduct);
router.post("/upload-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "Nessun file inviato." });
        return;
    }
    const stream = cloudinary_1.default.uploader.upload_stream({ folder: "bambu-ecomm/products" }, (error, result) => {
        if (error || !result) {
            res.status(500).json({ message: "Errore upload Cloudinary", error });
            return;
        }
        res.json({ url: result.secure_url });
    });
    streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
});
exports.default = router;
