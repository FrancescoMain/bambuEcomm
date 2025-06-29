"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const productImport_controller_1 = require("../controllers/productImport.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Solo ADMIN può importare prodotti
router.post("/import", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), upload.single("file"), productImport_controller_1.importProducts);
// Endpoint: GET /api/products/import/status?jobId=...
router.get("/import/status", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), productImport_controller_1.getImportStatus);
// Endpoint: GET /api/products/import/active
router.get("/import/active", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), productImport_controller_1.getActiveImportJob);
// Endpoint: POST /api/products/import/cancel
router.post("/import/cancel", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]), productImport_controller_1.cancelImportJob);
exports.default = router;
