import { Router } from "express";
import { body } from "express-validator";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin routes
router.post(
  "/",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  [
    body("name")
      .notEmpty()
      .withMessage("Il nome della categoria è obbligatorio."),
    body("description")
      .optional()
      .isString()
      .withMessage("La descrizione deve essere una stringa."),
  ],
  createCategory
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Il nome della categoria non può essere vuoto."),
    body("description")
      .optional()
      .isString()
      .withMessage("La descrizione deve essere una stringa."),
  ],
  updateCategory
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  deleteCategory
);

export default router;
