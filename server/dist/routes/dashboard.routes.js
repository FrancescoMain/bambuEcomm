"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Tutte le rotte dashboard richiedono autenticazione e ruolo ADMIN
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.authorizeRole)([client_1.Role.ADMIN]));
// GET /dashboard/stats - Statistiche per dashboard admin
router.get("/stats", dashboard_controller_1.getDashboardStats);
exports.default = router;
