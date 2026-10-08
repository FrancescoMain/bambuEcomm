import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/jwt";
import emailService from "../services/emailService";
import { AuthRequest } from "../middleware/auth.middleware";

import prisma from "../lib/prisma";

const MIN_PASSWORD = 8;

/** Email confrontate senza distinzione tra maiuscole e minuscole */
const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

const findUserByEmail = (email: unknown) =>
  prisma.user.findFirst({
    where: { email: { equals: normalizeEmail(email), mode: "insensitive" } },
    orderBy: { id: "asc" },
  });


// Registrazione di un nuovo utente
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { password, name } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password || !name) {
    res
      .status(400)
      .json({ message: "Email, password e nome sono obbligatori" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ message: "Inserisci un indirizzo email valido" });
    return;
  }
  if (String(password).length < MIN_PASSWORD) {
    res.status(400).json({ message: `La password deve avere almeno ${MIN_PASSWORD} caratteri` });
    return;
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "Utente già esistente" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        // Create a cart for the new user
        cart: {
          create: {},
        },
      },
      include: {
        cart: true, // Include the cart in the response
      },
    });

    // 🆕 Invio email di benvenuto
    try {
      console.log(`📧 Tentativo invio email di benvenuto a: ${user.email}`);
      const emailSent = await emailService.sendWelcomeEmail({
        name: user.name || "Utente",
        email: user.email,
      });

      if (emailSent) {
        console.log(
          `✅ Email di benvenuto inviata con successo a: ${user.email}`
        );
      } else {
        console.log(`⚠️ Fallimento invio email di benvenuto a: ${user.email}`);
      }
    } catch (emailError) {
      console.error("❌ Errore durante invio email benvenuto:", emailError);
      // Non interrompiamo la registrazione se l'email fallisce
    }

    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: "Utente registrato con successo",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Errore di registrazione:", error);
    res.status(500).json({
      message: "Errore durante la registrazione dell\\'utente",
      error: (error as Error).message,
    });
  }
};

// Login di un utente esistente
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email e password sono obbligatori" });
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: "Credenziali non valide" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Credenziali non valide" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role });

    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "Login effettuato con successo",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Errore di login:", error);
    res.status(500).json({
      message: "Errore durante il login",
      error: (error as Error).message,
    });
  }
};

// Logout dell\\'utente
export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // TODO: Implementare la logica di logout (es. invalidare token se si usa una blacklist)
    res.json({
      message: "Logout effettuato con successo. Per favore, cancella il token.",
    });
  } catch (error) {
    next(error);
  }
};

// Ottenere il profilo dell'utente corrente (richiede autenticazione)
// Risposta leggera: prima includeva tutti gli ordini, il carrello e le notifiche
// ed era richiesta a ogni caricamento di pagina.
export const getCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = (req as AuthRequest).user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Non autenticato" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) {
      res.status(404).json({ message: "Utente non trovato" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Errore nel recupero dell'utente corrente:", error);
    res.status(500).json({ message: "Errore durante il recupero dei dati dell'utente" });
  }
};

// PUT /api/auth/me { name } — aggiorna i dati del profilo
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user!.userId;
  const name = String(req.body?.name || "").trim();
  if (name.length < 2) {
    res.status(400).json({ message: "Inserisci un nome valido." });
    return;
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.slice(0, 120) },
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  });
  res.json({ message: "Profilo aggiornato", user });
};

// PUT /api/auth/password { currentPassword, newPassword }
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user!.userId;
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400).json({ message: "La nuova password deve avere almeno 8 caratteri." });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(String(currentPassword || ""), user.password))) {
    res.status(400).json({ message: "La password attuale non è corretta." });
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(String(newPassword), 10) },
  });
  res.json({ message: "Password aggiornata" });
};

/**
 * Richiesta reset password - genera token e invia email
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email è obbligatoria" });
    return;
  }

  try {
    // Verifica se l'utente esiste
    const user = await findUserByEmail(email);

    if (!user) {
      // Per sicurezza, non rivelare se l'email esiste o meno
      res.json({
        message:
          "Se l'email esiste nel sistema, riceverai un link per il reset della password",
      });
      return;
    }

    // Genera token sicuro
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora    // Salva il token nel database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Genera URL di reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Invia email di reset
    try {
      console.log(`📧 Tentativo invio email reset password a: ${user.email}`);
      const emailSent = await emailService.sendPasswordResetEmail({
        name: user.name || "Utente",
        email: user.email,
        resetToken,
        resetUrl,
      });

      if (emailSent) {
        console.log(`✅ Email reset password inviata a: ${user.email}`);
      } else {
        console.log(
          `⚠️ Fallimento invio email reset password a: ${user.email}`
        );
      }
    } catch (emailError) {
      console.error("❌ Errore durante invio email reset:", emailError);
    }

    res.json({
      message:
        "Se l'email esiste nel sistema, riceverai un link per il reset della password",
    });
  } catch (error) {
    console.error("Errore nella richiesta reset password:", error);
    res.status(500).json({
      message: "Errore durante la richiesta di reset password",
      error: (error as Error).message,
    });
  }
};

/**
 * Reset password - verifica token e aggiorna password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res
      .status(400)
      .json({ message: "Token e nuova password sono obbligatori" });
    return;
  }

  if (String(newPassword).length < MIN_PASSWORD) {
    res
      .status(400)
      .json({ message: `La password deve avere almeno ${MIN_PASSWORD} caratteri` });
    return;
  }

  try {
    // Trova il token nel database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      res.status(400).json({ message: "Token non valido o scaduto" });
      return;
    }

    // Verifica se il token è scaduto
    if (resetToken.expiresAt < new Date()) {
      res.status(400).json({ message: "Token scaduto" });
      return;
    }

    // Verifica se il token è già stato usato
    if (resetToken.used) {
      res.status(400).json({ message: "Token già utilizzato" });
      return;
    }

    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password dell'utente e marca il token come usato
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    console.log(
      `✅ Password resettata con successo per utente: ${resetToken.user.email}`
    );

    res.json({ message: "Password aggiornata con successo" });
  } catch (error) {
    console.error("Errore nel reset password:", error);
    res.status(500).json({
      message: "Errore durante il reset della password",
      error: (error as Error).message,
    });
  }
};

/**
 * Pulizia token scaduti (da chiamare periodicamente)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Token scaduti
          { used: true }, // Token già usati
        ],
      },
    });

    console.log(`🧹 Puliti ${result.count} token di reset scaduti/usati`);
  } catch (error) {
    console.error("Errore nella pulizia dei token:", error);
  }
};

/**
 * Genera un token sicuro per il reset password
 */
function generateSecureToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}
