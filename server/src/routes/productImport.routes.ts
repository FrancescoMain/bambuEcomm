import { Router } from "express";
import multer from "multer";
import {
  importProducts,
  getImportStatus,
  getActiveImportJob, // aggiunto
  cancelImportJob, // aggiunto
} from "../controllers/productImport.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Solo ADMIN può importare prodotti
router.post(
  "/import",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  upload.single("file"),
  importProducts
);

// Endpoint: GET /api/products/import/status?jobId=...
router.get(
  "/import/status",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  getImportStatus
);

// Endpoint: GET /api/products/import/active
router.get(
  "/import/active",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  getActiveImportJob
);

// Endpoint: POST /api/products/import/cancel
router.post(
  "/import/cancel",
  authenticateToken,
  authorizeRole([Role.ADMIN]),
  cancelImportJob
);

export default router;
