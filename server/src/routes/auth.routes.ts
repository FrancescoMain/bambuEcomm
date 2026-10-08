import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUserProfile,
  requestPasswordReset,
  resetPassword,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller";
import { isBot, noStore, rateLimit } from "../lib/http";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(noStore);
router.post("/register", rateLimit(10, 60 * 60 * 1000), registerUser);
router.post("/login", rateLimit(20, 10 * 60 * 1000), loginUser);
router.post("/logout", logoutUser);
router.get("/me", authenticateToken, getCurrentUserProfile);
router.put("/me", authenticateToken, updateProfile);
router.put("/password", authenticateToken, changePassword);

// Password reset routes
router.post(
  "/request-password-reset",
  rateLimit(5, 15 * 60 * 1000),
  (req, res, next) => {
    // Bot: risposta identica a quella normale, ma nessuna email inviata
    if (isBot(req.body)) {
      res.json({ message: "Se l'email esiste nel sistema, riceverai un link per il reset della password" });
      return;
    }
    next();
  },
  requestPasswordReset
);
router.post("/reset-password", resetPassword);

export default router;
