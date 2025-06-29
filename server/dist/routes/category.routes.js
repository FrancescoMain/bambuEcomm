"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", category_controller_1.getAllCategories);
router.get("/:id", category_controller_1.getCategoryById);
// Admin routes
router.post("/", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["ADMIN"]), [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Il nome della categoria è obbligatorio."),
    (0, express_validator_1.body)("description")
        .optional()
        .isString()
        .withMessage("La descrizione deve essere una stringa."),
], category_controller_1.createCategory);
router.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["ADMIN"]), [
    (0, express_validator_1.body)("name")
        .optional()
        .notEmpty()
        .withMessage("Il nome della categoria non può essere vuoto."),
    (0, express_validator_1.body)("description")
        .optional()
        .isString()
        .withMessage("La descrizione deve essere una stringa."),
], category_controller_1.updateCategory);
router.delete("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["ADMIN"]), category_controller_1.deleteCategory);
exports.default = router;
