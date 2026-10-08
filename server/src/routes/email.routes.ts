import { Router } from "express";
import { testEmailService } from "../controllers/emailTest.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Test del servizio email (solo admin: prima era pubblico e chiunque poteva
 * far partire email a spese del negozio)
 * POST /api/email/test
 * Body: { type: 'welcome' | 'password-reset' | 'newsletter' | 'order-confirmation' | 'order-admin' | 'order-shipped' | 'order-cancelled' }
 */
router.post("/test", authenticateToken, authorizeRole(["ADMIN"]), testEmailService);

export default router;
