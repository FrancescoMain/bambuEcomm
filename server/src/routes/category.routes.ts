import { Router } from "express";
import { body } from "express-validator";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../controllers/category.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { publicCache, noStore } from "../lib/http";

const router = Router();
const adminOnly = [authenticateToken, authorizeRole(["ADMIN"]), noStore];

// Public routes (in cache sulla CDN)
router.get("/", publicCache(300, 3600), getAllCategories);
router.get("/:id", publicCache(300, 3600), getCategoryById);

// Admin routes
router.post(
  "/",
  ...adminOnly,
  [
    body("name").notEmpty().withMessage("Il nome della categoria è obbligatorio."),
    body("description")
      .optional({ values: "null" })
      .isString()
      .withMessage("La descrizione deve essere una stringa."),
  ],
  createCategory
);

router.patch("/reorder", ...adminOnly, reorderCategories);

router.put(
  "/:id",
  ...adminOnly,
  [
    body("name").optional().notEmpty().withMessage("Il nome della categoria non può essere vuoto."),
    body("description")
      .optional({ values: "null" })
      .isString()
      .withMessage("La descrizione deve essere una stringa."),
  ],
  updateCategory
);

router.delete("/:id", ...adminOnly, deleteCategory);

export default router;
