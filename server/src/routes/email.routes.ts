import { Router } from 'express';
import { testEmailService } from '../controllers/emailTest.controller';

const router = Router();

/**
 * Route per testare il servizio email
 * POST /api/email/test
 * Body: { type: 'welcome' | 'password-reset' | 'newsletter' | 'order-confirmation' | 'order-admin' | 'order-shipped' | 'order-cancelled' }
 */
router.post('/test', testEmailService);

export default router;
