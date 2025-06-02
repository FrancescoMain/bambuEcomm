import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserProfile,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authenticateToken, getCurrentUserProfile);

export default router;
