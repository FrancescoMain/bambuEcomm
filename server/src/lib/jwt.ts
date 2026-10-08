import jwt from "jsonwebtoken";

/**
 * Chiave per firmare i token di login. In produzione è obbligatoria: senza,
 * chiunque potrebbe firmarsi un token da amministratore con la chiave di default.
 */
const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const SECRET = process.env.JWT_SECRET || (isProduction ? null : "bambu-dev-secret");

if (!SECRET) {
  console.error("❌ JWT_SECRET non impostato: login e area riservata sono disattivati finché non viene configurato.");
}

export class MissingSecretError extends Error {
  constructor() {
    super("Configurazione del server incompleta (JWT_SECRET mancante).");
  }
}

export const signToken = (payload: object, expiresIn: jwt.SignOptions["expiresIn"] = "24h"): string => {
  if (!SECRET) throw new MissingSecretError();
  return jwt.sign(payload, SECRET, { expiresIn });
};

export const verifyToken = <T = jwt.JwtPayload>(token: string): T => {
  if (!SECRET) throw new MissingSecretError();
  return jwt.verify(token, SECRET) as T;
};
