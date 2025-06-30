import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRole } from "../middleware/roleMiddleware";
import { Role } from "@prisma/client";

const router = Router();

// Tutte le rotte dashboard richiedono autenticazione e ruolo ADMIN
router.use(authenticateToken);
router.use(authorizeRole([Role.ADMIN]));

// GET /dashboard/stats - Statistiche per dashboard admin
router.get("/stats", getDashboardStats);

export default router;
