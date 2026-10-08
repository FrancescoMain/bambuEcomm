import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import emailService from "../services/emailService";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { isBot, isEmail, noStore, rateLimit, runInBackground } from "../lib/http";

const router = Router();

// POST /api/newsletter/subscribe { email, nome?, consenso: true }
router.post("/subscribe", rateLimit(5, 10 * 60 * 1000), async (req: Request, res: Response) => {
  const { email, nome, consenso } = req.body || {};
  if (isBot(req.body)) {
    res.json({ message: "Iscrizione completata" });
    return;
  }
  if (!isEmail(email)) {
    res.status(400).json({ message: "Inserisci un indirizzo email valido." });
    return;
  }
  if (consenso !== true) {
    res.status(400).json({ message: "Devi accettare l'informativa privacy per iscriverti." });
    return;
  }
  const normalized = email.trim().toLowerCase();
  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
    if (existing?.attivo) {
      res.json({ message: "Sei già iscritto alla newsletter. Grazie!" });
      return;
    }
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: { email: normalized, nome: nome ? String(nome).slice(0, 80) : null },
      update: { attivo: true },
    });
    runInBackground(emailService.sendNewsletterConfirmationEmail({ email: normalized }));
    res.status(201).json({ message: "Iscrizione completata! Controlla la tua email." });
  } catch (error) {
    console.error("Errore iscrizione newsletter:", error);
    res.status(500).json({ message: "Errore durante l'iscrizione, riprova." });
  }
});

// POST /api/newsletter/unsubscribe { email }
router.post("/unsubscribe", rateLimit(5, 10 * 60 * 1000), async (req: Request, res: Response) => {
  if (isBot(req.body)) {
    res.json({ message: "Iscrizione annullata." });
    return;
  }
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!isEmail(email)) {
    res.status(400).json({ message: "Email non valida." });
    return;
  }
  await prisma.newsletterSubscriber.updateMany({ where: { email }, data: { attivo: false } });
  res.json({ message: "Iscrizione annullata." });
});

// --- Admin ---
router.get(
  "/subscribers",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (req.query.format === "csv") {
      const rows = [
        "email,nome,attivo,data_iscrizione",
        ...subscribers.map(
          (s) =>
            `${s.email},"${(s.nome || "").replace(/"/g, '""')}",${s.attivo ? "si" : "no"},${s.createdAt.toISOString()}`
        ),
      ];
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="iscritti-newsletter.csv"');
      res.send("﻿" + rows.join("\n"));
      return;
    }
    res.json(subscribers);
  }
);

router.delete(
  "/subscribers/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    await prisma.newsletterSubscriber.deleteMany({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ message: "Iscritto rimosso" });
  }
);

export default router;
