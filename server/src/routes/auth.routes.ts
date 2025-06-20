import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserProfile,
  // requestPasswordReset,
  // resetPassword,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authenticateToken, getCurrentUserProfile);

// Temporaneamente commentate fino a risolvere il problema TypeScript
// router.post("/request-password-reset", requestPasswordReset);
// router.post("/reset-password", resetPassword);

export default router;
