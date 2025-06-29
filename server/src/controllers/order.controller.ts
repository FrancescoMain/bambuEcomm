import { Request, Response } from "express";
import { PrismaClient, Prisma, OrderStatus, Role } from "@prisma/client";
import { validationResult } from "express-validator";
import emailService from "../services/emailService";
import Stripe from "stripe";

const prisma = new PrismaClient();

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: Role;
  };
}

// Creare un nuovo ordine dal carrello dell'utente
export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  const { shippingAddressId, billingAddressId } = req.body;

  if (!shippingAddressId || !billingAddressId) {
    res.status(400).json({
      message: "ID indirizzo di spedizione e fatturazione sono obbligatori.",
    });
    return;
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        message: "Il carrello è vuoto. Impossibile creare un ordine.",
      });
      return;
    }

    // Verifica indirizzi
    const shippingAddress = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId },
    });
    const billingAddress = await prisma.address.findFirst({
      where: { id: billingAddressId, userId },
    });

    if (!shippingAddress) {
      res.status(404).json({
        message: `Indirizzo di spedizione con ID ${shippingAddressId} non trovato o non appartenente all'utente.`,
      });
      return;
    }
    if (!billingAddress) {
      res.status(404).json({
        message: `Indirizzo di fatturazione con ID ${billingAddressId} non trovato o non appartenente all'utente.`,
      });
      return;
    }

    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    // Validazione e preparazione dati OrderItem
    for (const item of cart.items) {
      // Rimosso controllo stock: il modello non lo prevede più
      totalAmount = totalAmount.plus(
        new Prisma.Decimal(item.product.prezzo).times(item.quantity)
      );
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.prezzo, // Salva il prezzo al momento dell'acquisto
      });
    }

    // Creazione ordine e svuotamento carrello in una transazione
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: OrderStatus.PENDING,
          shippingAddressId,
          billingAddressId,
          orderItems: {
            createMany: {
              data: orderItemsData,
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Rimosso aggiornamento stock prodotti      // Svuotamento carrello
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      return order;
    }); // Invio email di conferma ordine (al cliente e all'admin)
    console.log(
      "🔧 DEBUG: Iniziando processo invio email per ordine:",
      createdOrder.id
    );
    try {
      // Verifica che l'utente esista
      if (!createdOrder.user) {
        console.error("❌ Utente non trovato per l'ordine:", createdOrder.id);
      } else {
        console.log("🔧 DEBUG: Utente trovato:", {
          id: createdOrder.user.id,
          name: createdOrder.user.name,
          email: createdOrder.user.email,
        });

        // Prepara i dati per l'email
        const subtotal = createdOrder.orderItems.reduce((sum, item) => {
          return sum + Number(item.priceAtPurchase) * item.quantity;
        }, 0);
        const shippingCost = subtotal >= 50 ? 0 : 4.99;

        const orderData = {
          orderId: createdOrder.id.toString(),
          customerName: createdOrder.user.name || "Cliente",
          customerEmail: createdOrder.user.email,
          items: createdOrder.orderItems.map((item) => ({
            name: item.product.titolo,
            quantity: item.quantity,
            price: Number(item.priceAtPurchase),
          })),
          total: Number(createdOrder.totalAmount),
          subtotal: subtotal,
          shippingCost: shippingCost,
          orderDate: createdOrder.createdAt.toLocaleDateString("it-IT"),
          shippingAddress: createdOrder.shippingAddress,
        };

        console.log("🔧 DEBUG: Dati ordine preparati:", orderData);

        // Email al cliente
        console.log(
          `📧 Tentativo invio email conferma ordine a: ${orderData.customerEmail}`
        );
        const customerEmailSent =
          await emailService.sendOrderConfirmationEmail(orderData);

        if (customerEmailSent) {
          console.log(
            `✅ Email conferma ordine inviata al cliente: ${orderData.customerEmail}`
          );
        } else {
          console.log(
            `⚠️ Fallimento invio email conferma ordine al cliente: ${orderData.customerEmail}`
          );
        }

        // Email all'admin
        console.log(`📧 Tentativo invio notifica ordine all'admin`);
        const adminEmailSent =
          await emailService.sendOrderNotificationToAdmin(orderData);

        if (adminEmailSent) {
          console.log(`✅ Email notifica ordine inviata all'admin`);
        } else {
          console.log(`⚠️ Fallimento invio email notifica ordine all'admin`);
        }
      }
    } catch (emailError) {
      console.error("❌ Errore durante invio email ordine:", emailError);
      // Non blocchiamo la creazione dell'ordine se le email falliscono
    }

    res
      .status(201)
      .json({ message: "Ordine creato con successo.", order: createdOrder });
    return;
  } catch (error) {
    console.error("Errore nella creazione dell'ordine:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Gestisci errori specifici di Prisma se necessario
      if (error.code === "P2025") {
        res.status(404).json({
          message:
            "Uno o più record necessari (es. indirizzo, prodotto) non sono stati trovati.",
          details: error.meta?.cause,
        });
        return;
      }
    }
    res.status(500).json({
      message: "Errore interno del server durante la creazione dell'ordine.",
      error: (error as Error).message,
    });
    return;
  }
};

// Ottenere un ordine specifico per ID (utente proprietario o Admin)
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orderId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, titolo: true, immagine: true } },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }

    // L'utente può vedere solo i propri ordini, l'admin può vedere tutto
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      res.status(403).json({
        message: "Accesso negato. Non sei il proprietario di questo ordine.",
      });
      return;
    }

    res.json(order);
    return;
  } catch (error) {
    console.error(`Errore nel recupero dell'ordine ${orderId}:`, error);
    res.status(500).json({
      message: "Errore interno del server durante il recupero dell'ordine.",
      error: (error as Error).message,
    });
    return;
  }
};

// Ottenere tutti gli ordini per l'utente autenticato
export const getUserOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    // Prima recuperiamo l'email dell'utente corrente
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!currentUser) {
      res.status(404).json({ message: "Utente non trovato." });
      return;
    }

    // Cerchiamo ordini sia con userId che con guestEmail corrispondente
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: userId }, // Ordini fatti da loggato
          {
            AND: [
              { userId: null }, // Ordini guest
              { guestEmail: currentUser.email }, // Con la stessa email
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, titolo: true, immagine: true, prezzo: true },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(
      `📦 Recuperati ${orders.length} ordini per utente ${userId} (email: ${currentUser.email})`
    );
    console.log(
      "🔍 Ordini trovati:",
      orders.map((o) => ({
        id: o.id,
        userId: o.userId,
        guestEmail: o.guestEmail,
        status: o.status,
        total: o.totalAmount,
      }))
    );

    res.json(orders);
    return;
  } catch (error) {
    console.error(
      `Errore nel recupero degli ordini per l'utente ${userId}:`,
      error
    );
    res.status(500).json({
      message: "Errore interno del server durante il recupero degli ordini.",
      error: (error as Error).message,
    });
    return;
  }
};

// Ottenere tutti gli ordini (Admin only)
export const getAllOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // req.user.role è già verificato dal middleware authorizeRole([Role.ADMIN])
  const {
    page = "1",
    limit = "10",
    status,
    userId: queryUserId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const where: Prisma.OrderWhereInput = {};
  if (status) {
    where.status = status as OrderStatus;
  }
  if (queryUserId) {
    where.userId = parseInt(queryUserId as string, 10);
  }

  const orderBy: Prisma.OrderOrderByWithRelationInput = {};
  if (
    sortBy &&
    (sortBy === "createdAt" || sortBy === "totalAmount" || sortBy === "status")
  ) {
    orderBy[sortBy as keyof Prisma.OrderOrderByWithRelationInput] =
      sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const orders = await prisma.order.findMany({
      skip: offset,
      take: limitNum,
      where,
      orderBy,
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { id: true, titolo: true } },
          },
        },
        shippingAddress: true, // Potrebbe essere utile per l'admin
      },
    });

    const totalOrders = await prisma.order.count({ where });

    res.json({
      data: orders,
      totalPages: Math.ceil(totalOrders / limitNum),
      currentPage: pageNum,
      totalOrders,
    });
    return;
  } catch (error) {
    console.error("Errore nel recupero di tutti gli ordini:", error);
    res.status(500).json({
      message: "Errore interno del server durante il recupero degli ordini.",
      error: (error as Error).message,
    });
    return;
  }
};

// Aggiornare lo stato di un ordine (Admin only)
export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const orderId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }

  if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
    res
      .status(400)
      .json({ message: "Stato dell'ordine non valido o mancante." });
    return;
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }

    // Aggiorna solo lo stato dell'ordine.
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { titolo: true } },
          },
        },
      },
    });

    console.log("🔧 DEBUG: Order status update - Ordine aggiornato:", {
      orderId: updatedOrder.id,
      newStatus: status,
      hasUser: !!updatedOrder.user,
      guestEmail: updatedOrder.guestEmail,
      userEmail: updatedOrder.user?.email,
    });

    // Invio email di notifica in base al nuovo stato
    try {
      // Determina email e nome cliente (utente registrato o guest)
      const customerEmail = updatedOrder.user?.email || updatedOrder.guestEmail;
      const customerName =
        updatedOrder.user?.name ||
        `${updatedOrder.nome || ""} ${updatedOrder.cognome || ""}`.trim() ||
        "Cliente";

      if (customerEmail) {
        console.log("🔧 DEBUG: Preparazione email per aggiornamento ordine:", {
          customerEmail,
          customerName,
          orderId: updatedOrder.id,
          isGuest: !updatedOrder.user,
        });
        const orderData = {
          orderId: updatedOrder.id.toString(),
          customerName,
          customerEmail: customerEmail as string, // Safe cast perché abbiamo il check sopra
          items: updatedOrder.orderItems.map((item) => ({
            name: item.product.titolo,
            quantity: item.quantity,
            price: Number(item.priceAtPurchase),
          })),
          total: Number(updatedOrder.totalAmount),
          orderDate: updatedOrder.createdAt.toLocaleDateString("it-IT"),
        };

        if (status === OrderStatus.SHIPPED) {
          const orderDataWithTracking = {
            ...orderData,
            trackingNumber: updatedOrder.trackingNumber || undefined,
          };

          const logPrefix = updatedOrder.user ? "" : "[GUEST] ";
          console.log(
            `📧 ${logPrefix}Tentativo invio email ordine spedito a: ${orderData.customerEmail}`
          );
          const emailSent = await emailService.sendOrderShippedEmail(
            orderDataWithTracking
          );

          if (emailSent) {
            console.log(
              `✅ ${logPrefix}Email ordine spedito inviata al cliente: ${orderData.customerEmail}`
            );
          } else {
            console.log(
              `⚠️ ${logPrefix}Fallimento invio email ordine spedito al cliente: ${orderData.customerEmail}`
            );
          }
        } else if (status === OrderStatus.CANCELLED) {
          const logPrefix = updatedOrder.user ? "" : "[GUEST] ";
          console.log(
            `📧 ${logPrefix}Tentativo invio email ordine cancellato a: ${orderData.customerEmail}`
          );
          const emailSent =
            await emailService.sendOrderCancelledEmail(orderData);

          if (emailSent) {
            console.log(
              `✅ ${logPrefix}Email ordine cancellato inviata al cliente: ${orderData.customerEmail}`
            );
          } else {
            console.log(
              `⚠️ ${logPrefix}Fallimento invio email ordine cancellato al cliente: ${orderData.customerEmail}`
            );
          }

          // Invia anche notifica all'admin
          console.log(`📧 Tentativo invio notifica cancellazione all'admin`);
          const adminEmailSent =
            await emailService.sendOrderCancelledNotificationToAdmin(orderData);

          if (adminEmailSent) {
            console.log(`✅ Email notifica cancellazione inviata all'admin`);
          } else {
            console.log(
              `⚠️ Fallimento invio email notifica cancellazione all'admin`
            );
          }
        }
      } else {
        console.error(
          "❌ Nessuna email trovata per l'ordine:",
          updatedOrder.id,
          "- User email:",
          updatedOrder.user?.email,
          "- Guest email:",
          updatedOrder.guestEmail
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Errore durante invio email aggiornamento ordine:",
        emailError
      );
      // Non blocchiamo l'aggiornamento dell'ordine se le email falliscono
    }

    res.json({
      message: "Stato dell'ordine aggiornato con successo.",
      order: updatedOrder,
    });
    return;
  } catch (error) {
    console.error(
      `Errore nell'aggiornamento dello stato dell'ordine ${orderId}:`,
      error
    );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res
        .status(404)
        .json({ message: "Ordine non trovato per l'aggiornamento." });
      return;
    }
    res.status(500).json({
      message:
        "Errore interno del server durante l'aggiornamento dello stato dell'ordine.",
      error: (error as Error).message,
    });
    return;
  }
};

// Cancellare un ordine (Utente proprietario o Admin)
// Nota: la cancellazione effettiva potrebbe essere solo un cambio di stato a CANCELLED
export const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const orderId = parseInt(req.params.id, 10);
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true, user: true },
    });

    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }

    // L'utente può cancellare solo i propri ordini, l'admin può cancellare qualsiasi ordine
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      res.status(403).json({
        message: "Accesso negato. Non puoi cancellare questo ordine.",
      });
      return;
    }

    // Logica di cancellazione: solitamente si imposta lo stato a CANCELLED
    // e si ripristina lo stock dei prodotti.
    if (order.status === OrderStatus.CANCELLED) {
      res.status(400).json({ message: "L'ordine è già stato cancellato." });
      return;
    }

    // Check time limit for cancellation (24 hours for non-admin users)
    if (userRole !== Role.ADMIN) {
      const orderDate = new Date(order.createdAt);
      const cancelDeadline = new Date(
        orderDate.getTime() + 24 * 60 * 60 * 1000
      );
      const now = new Date();

      if (now > cancelDeadline) {
        res.status(400).json({
          message:
            "Il periodo di cancellazione gratuita (24 ore) è scaduto. Contatta l'assistenza clienti per richiedere la cancellazione.",
        });
        return;
      }

      // Non permettere la cancellazione se l'ordine è già stato spedito o consegnato
      if (
        order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.DELIVERED
      ) {
        res.status(400).json({
          message: `Non è possibile cancellare un ordine che è già ${order.status.toLowerCase()}.`,
        });
        return;
      }
    }

    let refundResult: Stripe.Refund | null = null;

    await prisma.$transaction(async (tx) => {
      // Aggiorna lo stato dell'ordine a CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // Processare il rimborso Stripe se presente paymentIntentId
      if (order.paymentIntentId) {
        try {
          console.log(
            `💳 Processando rimborso Stripe per ordine ${orderId}, PaymentIntent: ${order.paymentIntentId}`
          );

          refundResult = await stripe.refunds.create({
            payment_intent: order.paymentIntentId,
            reason: "requested_by_customer",
            metadata: {
              orderId: orderId.toString(),
              cancelledBy: userRole === Role.ADMIN ? "admin" : "customer",
              userId: userId.toString(),
            },
          });

          console.log(
            `✅ Rimborso Stripe creato con successo: ${refundResult.id}`
          );

          // Aggiorna lo stato a REFUNDED se il rimborso è stato processato con successo
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.REFUNDED },
          });
        } catch (stripeError: any) {
          console.error(
            `❌ Errore durante il rimborso Stripe per ordine ${orderId}:`,
            stripeError
          );

          // Se il rimborso fallisce, lasciamo lo stato come CANCELLED
          // e informiamo l'utente che il rimborso sarà processato manualmente
          console.log(`⚠️ Rimborso manuale richiesto per ordine ${orderId}`);
        }
      }
    });

    // Inviare notifica email all'utente
    try {
      const customerEmail = order.user?.email || order.guestEmail;
      const customerName =
        order.user?.name ||
        `${order.nome || ""} ${order.cognome || ""}`.trim() ||
        "Cliente";

      if (customerEmail) {
        const orderData = {
          orderId: order.id.toString(),
          customerName,
          customerEmail,
          items: order.orderItems.map((item: any) => ({
            name: item.product?.titolo || "Prodotto",
            quantity: item.quantity,
            price: Number(item.priceAtPurchase),
          })),
          total: Number(order.totalAmount),
          orderDate: new Date(order.createdAt).toLocaleDateString("it-IT"),
          cancelReason:
            userRole === Role.ADMIN
              ? "Cancellato dall'amministratore"
              : "Richiesto dal cliente",
        };

        const logPrefix = order.user ? "" : "[GUEST] ";
        console.log(
          `📧 ${logPrefix}Tentativo invio email ordine cancellato a: ${customerEmail}`
        );

        const emailSent = await emailService.sendOrderCancelledEmail(orderData);

        if (emailSent) {
          console.log(
            `✅ ${logPrefix}Email ordine cancellato inviata al cliente: ${customerEmail}`
          );
        } else {
          console.log(
            `⚠️ ${logPrefix}Fallimento invio email ordine cancellato al cliente: ${customerEmail}`
          );
        }

        // Invia anche notifica all'admin (se non è l'admin stesso a cancellare)
        if (userRole !== Role.ADMIN) {
          console.log(`📧 Tentativo invio notifica cancellazione all'admin`);
          const adminEmailSent =
            await emailService.sendOrderCancelledNotificationToAdmin(orderData);

          if (adminEmailSent) {
            console.log(`✅ Email notifica cancellazione inviata all'admin`);
          } else {
            console.log(
              `⚠️ Fallimento invio email notifica cancellazione all'admin`
            );
          }
        }
      }
    } catch (emailError) {
      console.error(
        "❌ Errore durante invio email cancellazione ordine:",
        emailError
      );
    }

    const message = refundResult
      ? "Ordine cancellato con successo. Il rimborso è stato processato e sarà visibile sulla tua carta entro 5-10 giorni lavorativi."
      : order.paymentIntentId
        ? "Ordine cancellato con successo. Il rimborso sarà processato manualmente entro 5-10 giorni lavorativi."
        : "Ordine cancellato con successo.";

    const response: any = { message };

    if (refundResult) {
      response.refund = {
        id: (refundResult as any).id,
        amount: (refundResult as any).amount,
        status: (refundResult as any).status,
      };
    }

    res.json(response);
    return;
  } catch (error) {
    console.error(`Errore nella cancellazione dell'ordine ${orderId}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({
        message: "Ordine o prodotto non trovato durante la cancellazione.",
      });
      return;
    }
    res.status(500).json({
      message:
        "Errore interno del server durante la cancellazione dell'ordine.",
      error: (error as Error).message,
    });
    return;
  }
};

// Funzione per reclamare ordini guest con la propria email (quando un utente si registra)
export const claimGuestOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Utente non autorizzato." });
    return;
  }

  try {
    // Recupera l'email dell'utente corrente
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!currentUser) {
      res.status(404).json({ message: "Utente non trovato." });
      return;
    }

    // Trova tutti gli ordini guest con la stessa email
    const guestOrders = await prisma.order.findMany({
      where: {
        AND: [{ userId: null }, { guestEmail: currentUser.email }],
      },
    });

    console.log(
      `🔄 Trovati ${guestOrders.length} ordini guest per email ${currentUser.email}`
    );

    if (guestOrders.length === 0) {
      res.json({
        message: "Nessun ordine guest trovato da reclamare.",
        claimedOrders: 0,
      });
      return;
    }

    // Aggiorna gli ordini guest per associarli all'utente
    const updateResult = await prisma.order.updateMany({
      where: {
        AND: [{ userId: null }, { guestEmail: currentUser.email }],
      },
      data: {
        userId: userId,
        // Manteniamo guestEmail per riferimento storico
      },
    });

    console.log(
      `✅ Reclamati ${updateResult.count} ordini per utente ${userId}`
    );

    res.json({
      message: `Successo! ${updateResult.count} ordini guest sono stati associati al tuo account.`,
      claimedOrders: updateResult.count,
    });
    return;
  } catch (error) {
    console.error(
      `Errore nel reclamare ordini guest per utente ${userId}:`,
      error
    );
    res.status(500).json({
      message: "Errore interno del server durante il reclamo degli ordini.",
      error: (error as Error).message,
    });
    return;
  }
};

// Aggiornare il tracking number di un ordine (Admin only)
export const updateOrderTracking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const orderId = parseInt(req.params.id, 10);
  const { trackingNumber } = req.body;

  if (isNaN(orderId)) {
    res.status(400).json({ message: "ID ordine non valido." });
    return;
  }

  if (
    !trackingNumber ||
    typeof trackingNumber !== "string" ||
    trackingNumber.trim().length === 0
  ) {
    res
      .status(400)
      .json({ message: "Numero di tracking non valido o mancante." });
    return;
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: "Ordine non trovato." });
      return;
    }

    // Aggiorna il tracking number dell'ordine
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber: trackingNumber.trim() },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: {
            product: { select: { titolo: true } },
          },
        },
      },
    });

    console.log("🚚 DEBUG: Tracking number update - Ordine aggiornato:", {
      orderId: updatedOrder.id,
      trackingNumber: updatedOrder.trackingNumber,
      hasUser: !!updatedOrder.user,
      guestEmail: updatedOrder.guestEmail,
    });

    // Se l'ordine è già stato spedito, invia email con tracking number
    if (updatedOrder.status === OrderStatus.SHIPPED) {
      const customerEmail = updatedOrder.user?.email || updatedOrder.guestEmail;

      if (customerEmail) {
        const orderData = {
          orderId: updatedOrder.id.toString(),
          customerName: updatedOrder.user?.name || "Cliente",
          customerEmail: customerEmail,
          items: updatedOrder.orderItems.map((item) => ({
            name: item.product.titolo,
            quantity: item.quantity,
            price: item.priceAtPurchase.toNumber(),
          })),
          total: updatedOrder.totalAmount.toNumber(),
          orderDate: updatedOrder.createdAt.toLocaleDateString("it-IT"),
          trackingNumber: updatedOrder.trackingNumber || undefined,
        };

        const logPrefix = updatedOrder.user ? "" : "[GUEST] ";
        console.log(
          `📧 ${logPrefix}Tentativo invio email tracking number a: ${customerEmail}`
        );

        const emailSent = await emailService.sendOrderShippedEmail(orderData);

        if (emailSent) {
          console.log(
            `✅ ${logPrefix}Email tracking number inviata al cliente: ${customerEmail}`
          );
        } else {
          console.log(
            `⚠️ ${logPrefix}Fallimento invio email tracking number al cliente: ${customerEmail}`
          );
        }
      }
    }

    res.json({
      message: "Tracking number aggiornato con successo.",
      order: updatedOrder,
    });
    return;
  } catch (error) {
    console.error(
      `Errore nell'aggiornamento del tracking number dell'ordine ${orderId}:`,
      error
    );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res
        .status(404)
        .json({ message: "Ordine non trovato per l'aggiornamento." });
      return;
    }
    res.status(500).json({
      message:
        "Errore interno del server durante l'aggiornamento del tracking number.",
      error: (error as Error).message,
    });
    return;
  }
};
