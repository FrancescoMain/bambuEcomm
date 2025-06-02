import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: { userId: string; role: Role };
}

export const authenticateToken: RequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: "Token di autenticazione mancante" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.status(401).json({ message: "Token scaduto" });
        return;
      }
      res.status(403).json({ message: "Token non valido" });
      return;
    }
    // @ts-ignore
    req.user = user;
    next();
  });
};

export const authorizeRole = (allowedRoles: Role[]): RequestHandler => {
  return (req, res, next) => {
    // @ts-ignore
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res
        .status(403)
        .json({ message: "Accesso negato: ruolo non autorizzato" });
      return;
    }
    next();
  };
};
