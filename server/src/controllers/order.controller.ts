import { Request, Response } from "express";
import { PrismaClient, Prisma, OrderStatus, Role } from "@prisma/client";
import { validationResult } from "express-validator";

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

    // Validazione stock e preparazione dati OrderItem
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        res.status(400).json({
          message: `Prodotto '${item.product.titolo}' non disponibile in quantità sufficiente. Stock disponibile: ${item.product.stock}, Richiesti: ${item.quantity}.`,
        });
        return; // Interrompe se un prodotto non è disponibile
      }
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

      // Aggiornamento stock prodotti
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Svuotamento carrello
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

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
    }

    // Logica aggiuntiva per la gestione dello stato (es. ripristino stock se cancellato)
    if (
      status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      // Se l'ordine viene cancellato e non era già cancellato, ripristina lo stock
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });
      await prisma.$transaction(
        orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    } else if (
      order.status === OrderStatus.CANCELLED &&
      status !== OrderStatus.CANCELLED
    ) {
      // Se un ordine era CANCELLED e viene cambiato ad un altro stato, decrementa lo stock di nuovo
      // Questo scenario potrebbe richiedere una logica più complessa per verificare la disponibilità
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      });
      for (const item of orderItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stock < item.quantity) {
          res.status(400).json({
            message: `Stock insufficiente per il prodotto '${
              product?.titolo || item.productId
            }' per riattivare l'ordine.`,
          });
          return;
        }
      }
      await prisma.$transaction(
        orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: { select: { titolo: true } } } },
      },
    });

    // TODO: Inviare notifica all'utente riguardo l'aggiornamento dello stato dell'ordine

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

      // Ripristina lo stock dei prodotti
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
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
