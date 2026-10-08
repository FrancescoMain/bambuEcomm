import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import emailService from "../services/emailService";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { isBot, isEmail, noStore, parseId, rateLimit, runInBackground } from "../lib/http";

const router = Router();

const TIPI = ["contatto", "b2b", "preventivo"] as const;

/** Campi extra ammessi per i moduli B2B e preventivo */
const readExtra = (tipo: string, body: any) => {
  const pick = (k: string, max = 160) => (body?.[k] ? String(body[k]).trim().slice(0, max) : undefined);
  if (tipo === "b2b") {
    return { ragioneSociale: pick("ragioneSociale"), partitaIva: pick("partitaIva", 20), citta: pick("citta", 80) };
  }
  if (tipo === "preventivo") {
    return {
      ente: pick("ente"),
      tipologia: pick("tipologia", 80),
      quantita: pick("quantita", 80),
      dataConsegna: pick("dataConsegna", 40),
      budget: pick("budget", 80),
    };
  }
  return undefined;
};

// POST /api/contact { tipo?, nome, email, telefono?, oggetto?, messaggio, consenso, ...campi extra }
router.post("/", rateLimit(5, 10 * 60 * 1000), async (req: Request, res: Response) => {
  const { nome, email, telefono, oggetto, messaggio, consenso } = req.body || {};
  const tipo = TIPI.includes(req.body?.tipo) ? (req.body.tipo as string) : "contatto";
  const dati = readExtra(tipo, req.body);
  if (isBot(req.body)) {
    res.status(201).json({ message: "Messaggio inviato" });
    return;
  }
  const errors: string[] = [];
  if (!nome || String(nome).trim().length < 2) errors.push("Inserisci il tuo nome.");
  if (!isEmail(email)) errors.push("Inserisci un indirizzo email valido.");
  if (!messaggio || String(messaggio).trim().length < 10) {
    errors.push("Il messaggio deve contenere almeno 10 caratteri.");
  }
  if (consenso !== true) errors.push("Devi accettare l'informativa privacy.");
  if (tipo === "b2b" && (!dati?.ragioneSociale || !/^\d{11}$/.test(String(dati?.partitaIva || "")))) {
    errors.push("Indica ragione sociale e partita IVA (11 cifre).");
  }
  if (errors.length) {
    res.status(400).json({ message: errors.join(" "), errors });
    return;
  }
  try {
    const saved = await prisma.contactMessage.create({
      data: {
        tipo,
        dati: dati ? JSON.parse(JSON.stringify(dati)) : undefined,
        nome: String(nome).trim().slice(0, 120),
        email: String(email).trim().toLowerCase(),
        telefono: telefono ? String(telefono).slice(0, 40) : null,
        oggetto: oggetto ? String(oggetto).slice(0, 160) : null,
        messaggio: String(messaggio).trim().slice(0, 5000),
      },
    });
    runInBackground(emailService.sendContactMessageToAdmin(saved));
    res.status(201).json({ message: "Messaggio inviato! Ti risponderemo il prima possibile." });
  } catch (error) {
    console.error("Errore form contatti:", error);
    res.status(500).json({ message: "Errore nell'invio del messaggio, riprova." });
  }
});

// --- Admin: messaggi ricevuti ---
router.get(
  "/",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    const tipo = String(req.query.tipo || "");
    const messages = await prisma.contactMessage.findMany({
      where: TIPI.includes(tipo as (typeof TIPI)[number]) ? { tipo } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(messages);
  }
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    await prisma.contactMessage.updateMany({ where: { id }, data: { letto: !!req.body?.letto } });
    res.json({ message: "Aggiornato" });
  }
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  noStore,
  async (req: Request, res: Response) => {
    await prisma.contactMessage.deleteMany({ where: { id: parseId(req.params.id) } });
    res.json({ message: "Messaggio eliminato" });
  }
);

export default router;
