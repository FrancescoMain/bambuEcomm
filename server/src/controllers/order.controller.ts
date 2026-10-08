import { Response } from "express";
import Stripe from "stripe";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { validationResult } from "express-validator";
import prisma from "../lib/prisma";
import stripe from "../lib/stripe";
import emailService, { OrderData } from "../services/emailService";
import { buildOrderEmailData } from "../services/order.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { clampInt, parseId } from "../lib/http";
import { signToken, verifyToken } from "../lib/jwt";
import { frontendUrl } from "../lib/urls";

const orderInclude = {
  orderItems: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      priceAtPurchase: true,
      prezzoListino: true,
      titolo: true,
      selectedVariants: true,
      personalizzazione: true,
      product: { select: { id: true, titolo: true, immagine: true, prezzo: true } },
    },
  },
  shippingAddress: true,
  billingAddress: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

const emailInclude = {
  orderItems: { include: { product: { select: { titolo: true } } } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

const loadEmailData = async (orderId: number): Promise<OrderData | null> => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: emailInclude });
  return order ? buildOrderEmailData(order) : null;
};

// GET /api/orders/:id — proprietario o admin
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const orderId = parseId(req.params.id);
  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }
    if (req.user!.role !== Role.ADMIN && order.userId !== req.user!.userId) {
      res.status(403).json({ message: "Accesso negato. Non sei il proprietario di questo ordine." });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error(`Errore nel recupero dell'ordine ${orderId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante il recupero dell'ordine." });
  }
};

// GET /api/orders/my-orders — ordini dell'utente.
// Gli ordini fatti da ospite compaiono solo dopo averli collegati con il link inviato
// all'email (prima bastava registrarsi con l'email di un altro per vederli).
export const getUserOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  try {
    const orders = await prisma.order.findMany({
      where: { userId, status: { not: OrderStatus.AWAITING_PAYMENT } },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
    res.json(orders);
  } catch (error) {
    console.error(`Errore nel recupero degli ordini per l'utente ${userId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante il recupero degli ordini." });
  }
};

// GET /api/orders — tutti gli ordini (admin) con filtri e ricerca
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = clampInt(req.query.page, 1, 1, 10_000);
  const limit = clampInt(req.query.limit, 20, 1, 100);
  const status = String(req.query.status || "");
  const q = String(req.query.q || "").trim();

  const where: Prisma.OrderWhereInput = {};
  if (status && status !== "all" && (Object.values(OrderStatus) as string[]).includes(status)) {
    where.status = status as OrderStatus;
  } else if (status !== "all") {
    // Di default non mostriamo i checkout abbandonati prima del pagamento
    where.status = { not: OrderStatus.AWAITING_PAYMENT };
  }
  if (req.query.userId) where.userId = parseId(req.query.userId);
  if (q) {
    const id = /^#?\d+$/.test(q) ? parseInt(q.replace("#", ""), 10) : NaN;
    where.OR = [
      ...(isNaN(id) ? [] : [{ id }]),
      { guestEmail: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { nome: { contains: q, mode: "insensitive" } },
      { cognome: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q } },
    ];
  }

  const sortBy = String(req.query.sortBy || "createdAt");
  const orderBy: Prisma.OrderOrderByWithRelationInput = {
    [["createdAt", "totalAmount", "status"].includes(sortBy) ? sortBy : "createdAt"]:
      req.query.sortOrder === "asc" ? "asc" : "desc",
  };

  try {
    const [orders, totalOrders, counts] = await Promise.all([
      prisma.order.findMany({ skip: (page - 1) * limit, take: limit, where, orderBy, include: orderInclude }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    res.json({
      data: orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders,
      countsByStatus: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  } catch (error) {
    console.error("Errore nel recupero di tutti gli ordini:", error);
    res.status(500).json({ message: "Errore interno del server durante il recupero degli ordini." });
  }
};

const notifyStatusChange = async (orderId: number, status: OrderStatus) => {
  try {
    const data = await loadEmailData(orderId);
    if (!data?.customerEmail) return;
    if (status === OrderStatus.SHIPPED) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { trackingNumber: true } });
      await emailService.sendOrderShippedEmail({ ...data, trackingNumber: order?.trackingNumber || undefined });
    } else if (status === OrderStatus.CANCELLED) {
      await emailService.sendOrderCancelledEmail(data);
      await emailService.sendOrderCancelledNotificationToAdmin(data);
    }
  } catch (error) {
    console.error("Errore invio email aggiornamento ordine:", error);
  }
};

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const orderId = parseId(req.params.id);
  const status = req.body.status as OrderStatus;
  if (isNaN(orderId) || !Object.values(OrderStatus).includes(status)) {
    res.status(400).json({ message: "Ordine o stato non valido." });
    return;
  }
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!current) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: orderInclude,
    });
    if (current.status !== status) await notifyStatusChange(orderId, status);
    res.json({ message: "Stato dell'ordine aggiornato con successo.", order: updatedOrder });
  } catch (error) {
    console.error(`Errore nell'aggiornamento dello stato dell'ordine ${orderId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante l'aggiornamento dello stato." });
  }
};

// PATCH /api/orders/:id/tracking (admin)
export const updateOrderTracking = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const orderId = parseId(req.params.id);
  // Stringa vuota = rimuove il tracking (es. inserito per errore)
  const trackingNumber = String(req.body.trackingNumber || "").trim() || null;
  if (isNaN(orderId)) {
    res.status(400).json({ message: "Ordine non valido." });
    return;
  }
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber },
      include: orderInclude,
    });
    // Se l'ordine è già spedito, il cliente riceve subito il tracking
    if (trackingNumber && updatedOrder.status === OrderStatus.SHIPPED) {
      const data = await loadEmailData(orderId);
      if (data?.customerEmail) await emailService.sendOrderShippedEmail({ ...data, trackingNumber });
    }
    res.json({
      message: trackingNumber ? "Tracking number aggiornato con successo." : "Tracking number rimosso.",
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: "Ordine non trovato per l'aggiornamento." });
      return;
    }
    console.error(`Errore tracking ordine ${orderId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante l'aggiornamento del tracking." });
  }
};

// PATCH /api/orders/:id/cancel — proprietario (entro 24h, non spedito) o admin; rimborso Stripe
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const orderId = parseId(req.params.id);
  const { userId, role } = req.user!;
  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }
    if (role !== Role.ADMIN && order.userId !== userId) {
      res.status(403).json({ message: "Accesso negato. Non puoi cancellare questo ordine." });
      return;
    }
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      res.status(400).json({ message: "L'ordine è già stato cancellato." });
      return;
    }
    if (role !== Role.ADMIN) {
      if (Date.now() > order.createdAt.getTime() + 24 * 60 * 60 * 1000) {
        res.status(400).json({
          message:
            "Il periodo di cancellazione (24 ore) è scaduto. Puoi usare il modulo di recesso online o contattarci.",
        });
        return;
      }
      if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
        res.status(400).json({ message: "Non è possibile cancellare un ordine già spedito." });
        return;
      }
    }

    let refund: Stripe.Refund | null = null;
    if (order.paymentIntentId) {
      try {
        refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: "requested_by_customer",
          metadata: { orderId: String(orderId), cancelledBy: role === Role.ADMIN ? "admin" : "customer" },
        });
      } catch (stripeError) {
        console.error(`Errore rimborso Stripe ordine ${orderId}:`, stripeError);
      }
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { status: refund ? OrderStatus.REFUNDED : OrderStatus.CANCELLED },
    });

    try {
      const data = await loadEmailData(orderId);
      if (data?.customerEmail) {
        const payload = {
          ...data,
          cancelReason: role === Role.ADMIN ? "Cancellato dal negozio" : "Richiesto dal cliente",
        };
        await emailService.sendOrderCancelledEmail(payload);
        if (role !== Role.ADMIN) await emailService.sendOrderCancelledNotificationToAdmin(payload);
      }
    } catch (emailError) {
      console.error("Errore invio email cancellazione ordine:", emailError);
    }

    res.json({
      message: refund
        ? "Ordine cancellato. Il rimborso è stato avviato e sarà visibile entro 5-10 giorni lavorativi."
        : order.paymentIntentId
          ? "Ordine cancellato. Il rimborso sarà effettuato manualmente entro 5-10 giorni lavorativi."
          : "Ordine cancellato con successo.",
      refund: refund ? { id: refund.id, amount: refund.amount, status: refund.status } : undefined,
    });
  } catch (error) {
    console.error(`Errore nella cancellazione dell'ordine ${orderId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante la cancellazione dell'ordine." });
  }
};

type ClaimToken = { purpose: string; userId: number; email: string };

// POST /api/orders/claim-guest-orders/request — invia all'email dell'account il link
// per collegare gli ordini fatti da ospite (dimostra che l'email è davvero sua)
export const requestGuestOrdersClaim = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const generic = {
    message:
      "Se ci sono ordini fatti come ospite con la tua email, ti abbiamo inviato un link per collegarli al profilo.",
  };
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) {
      res.status(404).json({ message: "Utente non trovato." });
      return;
    }
    const count = await prisma.order.count({
      where: { userId: null, guestEmail: { equals: user.email, mode: "insensitive" } },
    });
    if (count > 0) {
      const token = signToken({ purpose: "claim", userId, email: user.email.toLowerCase() }, "2h");
      await emailService.sendClaimOrdersEmail({
        email: user.email,
        name: user.name || "",
        count,
        link: `${frontendUrl()}/account/ordini?collega=${encodeURIComponent(token)}`,
      });
    }
    res.json(generic);
  } catch (error) {
    console.error("Errore richiesta collegamento ordini:", error);
    res.status(500).json({ message: "Errore nell'invio dell'email, riprova." });
  }
};

// POST /api/orders/claim-guest-orders { token } — collega gli ordini dopo il clic sul link
export const claimGuestOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  let payload: ClaimToken;
  try {
    payload = verifyToken<ClaimToken>(String(req.body?.token || ""));
  } catch {
    res.status(400).json({ message: "Il link non è valido o è scaduto: richiedine uno nuovo." });
    return;
  }
  if (payload.purpose !== "claim" || payload.userId !== userId) {
    res.status(403).json({ message: "Questo link appartiene a un altro account." });
    return;
  }
  try {
    const result = await prisma.order.updateMany({
      where: { userId: null, guestEmail: { equals: payload.email, mode: "insensitive" } },
      data: { userId },
    });
    res.json({
      message: result.count
        ? `${result.count} ${result.count === 1 ? "ordine collegato" : "ordini collegati"} al tuo account.`
        : "Nessun ordine da collegare.",
      claimedOrders: result.count,
    });
  } catch (error) {
    console.error(`Errore nel collegare ordini guest per utente ${userId}:`, error);
    res.status(500).json({ message: "Errore interno del server durante il collegamento degli ordini." });
  }
};
