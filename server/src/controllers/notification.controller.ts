import { Request, Response } from "express";
import { PrismaClient, Role, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: Role;
  };
}

// Ottenere le notifiche per l'utente corrente (loggato)
export const getUserNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Errore durante il recupero delle notifiche utente:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Segnare una notifica come letta (utente loggato, proprietario della notifica)
export const markNotificationAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(notificationId, 10) },
    });

    if (!notification) {
      res.status(404).json({ message: "Notifica non trovata." });
      return;
    }

    if (notification.userId !== userId) {
      res
        .status(403)
        .json({
          message:
            "Accesso negato. Non sei il proprietario di questa notifica.",
        });
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(notificationId, 10) },
      data: { isRead: true },
    });

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Errore durante l'aggiornamento della notifica:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Segnare tutte le notifiche come lette (utente loggato)
export const markAllNotificationsAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res
      .status(200)
      .json({ message: "Tutte le notifiche sono state segnate come lette." });
  } catch (error) {
    console.error(
      "Errore durante l'aggiornamento di tutte le notifiche:",
      error
    );
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Eliminare una notifica (utente loggato, proprietario della notifica)
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Utente non autorizzato." });
      return;
    }

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(notificationId, 10) },
    });

    if (!notification) {
      res.status(404).json({ message: "Notifica non trovata." });
      return;
    }

    if (notification.userId !== userId) {
      res
        .status(403)
        .json({
          message:
            "Accesso negato. Non sei il proprietario di questa notifica.",
        });
      return;
    }

    await prisma.notification.delete({
      where: { id: parseInt(notificationId, 10) },
    });

    res.status(200).json({ message: "Notifica eliminata con successo." });
  } catch (error: any) {
    if (error.code === "P2025") {
      res
        .status(404)
        .json({ message: "Notifica non trovata o già eliminata." });
      return;
    }
    console.error("Errore durante l'eliminazione della notifica:", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// --- Funzioni potenzialmente solo per ADMIN ---

// Ottenere tutte le notifiche (ADMIN)
export const getAllNotificationsAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (req.user?.role !== Role.ADMIN) {
    res
      .status(403)
      .json({
        message: "Accesso negato. Funzione riservata agli amministratori.",
      });
    return;
  }

  const { page = 1, limit = 10, type, isRead, userId: queryUserId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const whereClause: any = {};
    if (type) whereClause.type = type as NotificationType;
    if (isRead !== undefined) whereClause.isRead = isRead === "true";
    if (queryUserId) whereClause.userId = parseInt(queryUserId as string, 10);

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, name: true } } }, // Includi info utente
    });

    const totalNotifications = await prisma.notification.count({
      where: whereClause,
    });

    res.status(200).json({
      data: notifications,
      totalPages: Math.ceil(totalNotifications / Number(limit)),
      currentPage: Number(page),
      totalCount: totalNotifications,
    });
  } catch (error) {
    console.error(
      "Errore durante il recupero di tutte le notifiche (admin):",
      error
    );
    res.status(500).json({ message: "Errore interno del server." });
  }
};

// Creare una notifica (ADMIN - es. per annunci globali o notifiche manuali)
export const createNotificationAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (req.user?.role !== Role.ADMIN) {
    res
      .status(403)
      .json({
        message: "Accesso negato. Funzione riservata agli amministratori.",
      });
    return;
  }

  const { userId, type, message, relatedEntityType, relatedEntityId } =
    req.body;

  if (!type || !message) {
    res
      .status(400)
      .json({ message: "Tipo e messaggio della notifica sono obbligatori." });
    return;
  }

  // Validazione del tipo di notifica
  if (!Object.values(NotificationType).includes(type as NotificationType)) {
    res.status(400).json({ message: "Tipo di notifica non valido." });
    return;
  }

  // Se userId è fornito, verifica che l'utente esista
  if (userId) {
    const userExists = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!userExists) {
      res.status(404).json({ message: `Utente con ID ${userId} non trovato.` });
      return;
    }
  }

  try {
    const newNotification = await prisma.notification.create({
      data: {
        userId: userId ? Number(userId) : null,
        type: type as NotificationType,
        message,
        relatedEntityType,
        relatedEntityId: relatedEntityId ? Number(relatedEntityId) : undefined,
        isRead: false, // Le nuove notifiche sono sempre non lette
      },
    });
    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Errore durante la creazione della notifica (admin):", error);
    res.status(500).json({ message: "Errore interno del server." });
  }
};

/**
 * Funzione helper interna per creare notifiche (non esposta come rotta API diretta,
 * ma usata da altri controller, es. ordini, utenti etc.)
 */
export const createSystemNotification = async (
  userId: number | null, // Null se per admin o sistema generale
  type: NotificationType,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: number
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: userId,
        type,
        message,
        relatedEntityType,
        relatedEntityId,
      },
    });
    console.log(`Notifica creata: ${type} - ${message}`);
  } catch (error) {
    console.error(
      "Errore durante la creazione della notifica di sistema:",
      error
    );
  }
};
