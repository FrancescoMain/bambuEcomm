import { Request, Response, NextFunction, RequestHandler } from "express";
import { Role } from "@prisma/client";
import { MissingSecretError, verifyToken } from "../lib/jwt";

export interface AuthUser {
  userId: number;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/** Accetta solo token di accesso: quelli con uno scopo (es. collegamento ordini via email) non valgono come login. */
const verifyAccessToken = (token: string): AuthUser => {
  const payload = verifyToken<Partial<AuthUser> & { purpose?: string }>(token);
  if (payload.purpose || typeof payload.userId !== "number" || !payload.role) throw new Error("Token non valido");
  return { userId: payload.userId, role: payload.role };
};

const readToken = (req: Request): string | null => {
  const authHeader = req.headers["authorization"];
  return authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
};

export const authenticateToken: RequestHandler = (req, res: Response, next: NextFunction) => {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ message: "Token di autenticazione mancante" });
    return;
  }
  try {
    (req as AuthRequest).user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof MissingSecretError) {
      res.status(500).json({ message: err.message });
      return;
    }
    if ((err as Error).name === "TokenExpiredError") {
      res.status(401).json({ message: "Token scaduto" });
      return;
    }
    res.status(403).json({ message: "Token non valido" });
  }
};

/** Come authenticateToken ma non obbligatorio: se il token manca o non è valido si prosegue da ospite. */
export const optionalAuth: RequestHandler = (req, res, next) => {
  const token = readToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    (req as AuthRequest).user = verifyAccessToken(token);
  } catch {
    // token assente/non valido: si prosegue come ospite
  }
  next();
};

export const authorizeRole = (allowedRoles: (Role | "ADMIN" | "USER")[]): RequestHandler => {
  return (req, res, next) => {
    const user = (req as AuthRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ message: "Accesso negato: ruolo non autorizzato" });
      return;
    }
    next();
  };
};
