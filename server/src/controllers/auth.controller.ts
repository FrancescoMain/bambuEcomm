import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production

// Registrazione di un nuovo utente
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res
      .status(400)
      .json({ message: "Email, password e nome sono obbligatori" });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
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
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(400).json({ message: "Credenziali non valide" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Credenziali non valide" });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

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

// Ottenere il profilo dell\\'utente corrente (richiede autenticazione)
export const getCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // The user ID should be available from the request object after authentication middleware runs
  // For now, we\\'ll assume it\\'s passed in a custom property, e.g., req.user
  // @ts-ignore
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Non autenticato" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        addresses: true,
        cart: true,
        orders: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "Utente non trovato" });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Errore nel recupero dell\\'utente corrente:", error);
    res.status(500).json({
      message: "Errore durante il recupero dei dati dell\\'utente",
      error: (error as Error).message,
    });
  }
};
