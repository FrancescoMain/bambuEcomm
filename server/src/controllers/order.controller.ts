import { Request, Response } from "express";
import { PrismaClient, Prisma, OrderStatus, Role } from "@prisma/client";
import { validationResult } from "express-validator";
import emailService from "../services/emailService";

const prisma = new PrismaClient();

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
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, titolo: true, immagine: true } },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

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
    } // Aggiorna solo lo stato dell'ordine.
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

    // Invio email di notifica in base al nuovo stato
    try {
      if (updatedOrder.user) {
        const orderData = {
          orderId: updatedOrder.id.toString(),
          customerName: updatedOrder.user.name || "Cliente",
          customerEmail: updatedOrder.user.email,
          items: updatedOrder.orderItems.map((item) => ({
            name: item.product.titolo,
            quantity: item.quantity,
            price: Number(item.priceAtPurchase),
          })),
          total: Number(updatedOrder.totalAmount),
          orderDate: updatedOrder.createdAt.toLocaleDateString("it-IT"),
        };

        if (status === OrderStatus.SHIPPED) {
          console.log(
            `📧 Tentativo invio email ordine spedito a: ${orderData.customerEmail}`
          );
          const emailSent = await emailService.sendOrderShippedEmail(orderData);

          if (emailSent) {
            console.log(
              `✅ Email ordine spedito inviata al cliente: ${orderData.customerEmail}`
            );
          } else {
            console.log(
              `⚠️ Fallimento invio email ordine spedito al cliente: ${orderData.customerEmail}`
            );
          }
        } else if (status === OrderStatus.CANCELLED) {
          console.log(
            `📧 Tentativo invio email ordine cancellato a: ${orderData.customerEmail}`
          );
          const emailSent =
            await emailService.sendOrderCancelledEmail(orderData);

          if (emailSent) {
            console.log(
              `✅ Email ordine cancellato inviata al cliente: ${orderData.customerEmail}`
            );
          } else {
            console.log(
              `⚠️ Fallimento invio email ordine cancellato al cliente: ${orderData.customerEmail}`
            );
          }
        }
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
      include: { orderItems: true },
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

    // Non permettere la cancellazione se l'ordine è già stato spedito o consegnato (a meno che non sia un admin con logica specifica)
    if (
      userRole !== Role.ADMIN &&
      (order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.DELIVERED)
    ) {
      res.status(400).json({
        message: `Non è possibile cancellare un ordine che è già ${order.status.toLowerCase()}.`,
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Aggiorna lo stato dell'ordine a CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      // RIMOSSO: Ripristino stock prodotti
    });

    // TODO: Inviare notifica all'utente (e admin se cancellato dall'utente)

    res.json({ message: "Ordine cancellato con successo." });
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

// TODO: Implementare le seguenti funzioni:
// export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {};
// export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {};
// export const getAllOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {}; // Admin only
// export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {}; // Admin only
// export const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {}; // User and Admin
