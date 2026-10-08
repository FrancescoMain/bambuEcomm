import { Router, Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import emailService from "../services/emailService";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";
import { isBot, isEmail, noStore, parseId, rateLimit, runInBackground } from "../lib/http";
import { getSettings } from "../lib/settings";

// Recesso online (art. 52 e ss. Codice del Consumo, "pulsante di recesso" Dir. UE 2023/2673):
// il cliente indica numero d'ordine ed email, sceglie gli articoli e conferma.
const router = Router();
router.use(noStore);

const RECEDIBLE: OrderStatus[] = [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const findOrder = async (orderIdRaw: unknown, emailRaw: unknown) => {
  const orderId = parseId(String(orderIdRaw ?? "").replace("#", ""));
  const email = String(emailRaw || "").trim().toLowerCase();
  if (isNaN(orderId) || !isEmail(email)) return null;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      guestEmail: true,
      nome: true,
      cognome: true,
      user: { select: { email: true } },
      orderItems: {
        select: { id: true, titolo: true, quantity: true, personalizzazione: true, product: { select: { titolo: true } } },
      },
    },
  });
  if (!order) return null;
  const orderEmail = (order.user?.email || order.guestEmail || "").toLowerCase();
  return orderEmail === email ? order : null;
};

// POST /api/recesso/ordine { orderId, email } — verifica e restituisce gli articoli
router.post("/ordine", rateLimit(10, 10 * 60 * 1000), async (req: Request, res: Response) => {
  if (isBot(req.body)) {
    res.status(404).json({ message: "Nessun ordine trovato con questi dati." });
    return;
  }
  const order = await findOrder(req.body?.orderId, req.body?.email);
  if (!order) {
    res.status(404).json({ message: "Nessun ordine trovato con questi dati. Controlla numero d'ordine ed email." });
    return;
  }
  if (!RECEDIBLE.includes(order.status)) {
    res.status(400).json({ message: "Per questo ordine non è possibile richiedere il recesso online. Contattaci." });
    return;
  }
  res.json({
    orderId: order.id,
    data: order.createdAt,
    nome: `${order.nome || ""} ${order.cognome || ""}`.trim(),
    articoli: order.orderItems.map((i) => ({
      orderItemId: i.id,
      titolo: i.titolo || i.product.titolo,
      quantity: i.quantity,
      personalizzato: !!i.personalizzazione,
    })),
  });
});

// POST /api/recesso { orderId, email, nome, articoli: [{ orderItemId, quantity }], motivo?, note? }
router.post("/", rateLimit(5, 10 * 60 * 1000), async (req: Request, res: Response) => {
  if (isBot(req.body)) {
    res.status(201).json({ message: "Richiesta di recesso registrata." });
    return;
  }
  const order = await findOrder(req.body?.orderId, req.body?.email);
  if (!order || !RECEDIBLE.includes(order.status)) {
    res.status(404).json({ message: "Ordine non trovato o non recedibile." });
    return;
  }
  const requested: { orderItemId: unknown; quantity: unknown }[] = Array.isArray(req.body?.articoli)
    ? req.body.articoli
    : [];
  const articoli = requested
    .map((a) => {
      const item = order.orderItems.find((i) => i.id === parseId(a.orderItemId));
      if (!item) return null;
      const quantity = Math.min(item.quantity, Math.max(1, parseInt(String(a.quantity), 10) || 1));
      return { orderItemId: item.id, titolo: item.titolo || item.product.titolo, quantity };
    })
    .filter((a): a is { orderItemId: number; titolo: string; quantity: number } => !!a);
  if (!articoli.length) {
    res.status(400).json({ message: "Seleziona almeno un articolo." });
    return;
  }
  const nome = String(req.body?.nome || `${order.nome || ""} ${order.cognome || ""}`).trim().slice(0, 120);
  const email = String(req.body.email).trim().toLowerCase();
  const motivo = req.body?.motivo ? String(req.body.motivo).slice(0, 200) : null;
  const note = req.body?.note ? String(req.body.note).slice(0, 2000) : null;

  const request = await prisma.withdrawalRequest.create({
    data: { orderId: order.id, email, nome, articoli, motivo, note },
  });
  const settings = await getSettings();
  // Conferma di ricezione su supporto durevole (email) al cliente + avviso al negozio
  runInBackground(
    Promise.all([
      emailService.sendWithdrawalReceipt({
        email,
        nome,
        orderId: order.id,
        requestId: request.id,
        articoli,
        motivo,
        data: request.createdAt,
        indirizzoReso: `${settings.azienda.ragioneSociale}, ${settings.contatti.indirizzo}, ${settings.contatti.citta}`,
      }),
      emailService.sendWithdrawalToAdmin({ email, nome, orderId: order.id, requestId: request.id, articoli, motivo, note }),
    ])
  );
  res.status(201).json({
    message: "Richiesta di recesso registrata. Ti abbiamo inviato una conferma via email.",
    requestId: request.id,
  });
});

// --- Admin ---
router.get("/", authenticateToken, authorizeRole(["ADMIN"]), async (req: Request, res: Response) => {
  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { order: { select: { id: true, totalAmount: true, status: true } } },
  });
  res.json(requests);
});

router.patch("/:id", authenticateToken, authorizeRole(["ADMIN"]), async (req: Request, res: Response) => {
  const stato = String(req.body?.stato || "");
  if (!["ricevuta", "accettata", "rifiutata", "rimborsata"].includes(stato)) {
    res.status(400).json({ message: "Stato non valido" });
    return;
  }
  const updated = await prisma.withdrawalRequest.update({
    where: { id: parseId(req.params.id) },
    data: { stato },
  });
  res.json(updated);
});

export default router;
