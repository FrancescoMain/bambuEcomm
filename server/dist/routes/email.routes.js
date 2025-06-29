"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailTest_controller_1 = require("../controllers/emailTest.controller");
const router = (0, express_1.Router)();
/**
 * Route per testare il servizio email
 * POST /api/email/test
 * Body: { type: 'welcome' | 'password-reset' | 'newsletter' | 'order-confirmation' | 'order-admin' | 'order-shipped' | 'order-cancelled' }
 */
router.post("/test", emailTest_controller_1.testEmailService);
exports.default = router;
