"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.registerUser);
router.post("/login", auth_controller_1.loginUser);
router.post("/logout", auth_controller_1.logoutUser);
router.get("/me", auth_middleware_1.authenticateToken, auth_controller_1.getCurrentUserProfile);
// Password reset routes
router.post("/request-password-reset", auth_controller_1.requestPasswordReset);
router.post("/reset-password", auth_controller_1.resetPassword);
exports.default = router;
