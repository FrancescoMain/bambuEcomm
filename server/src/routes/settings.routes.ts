import { Router, Request, Response } from "express";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { publicCache, noStore, revalidateStorefront } from "../lib/http";
import { getSettings, saveSettings } from "../lib/settings";

const router = Router();

// GET /api/settings — impostazioni pubbliche del negozio (spedizioni, banner, contatti)
router.get("/", publicCache(300, 3600), async (req: Request, res: Response) => {
  try {
    res.json(await getSettings());
  } catch (error) {
    console.error("Errore lettura impostazioni:", error);
    res.status(500).json({ message: "Errore nel recupero delle impostazioni" });
  }
});

// PUT /api/settings — salva (merge) le impostazioni. Solo admin.
router.put(
  "/",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    try {
      const settings = await saveSettings(req.body || {});
      revalidateStorefront(["settings"]);
      res.json({ message: "Impostazioni salvate", settings });
    } catch (error) {
      console.error("Errore salvataggio impostazioni:", error);
      res.status(500).json({ message: "Errore nel salvataggio delle impostazioni" });
    }
  }
);

export default router;
