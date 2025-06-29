"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({ message: "Token di autenticazione mancante" });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
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
exports.authenticateToken = authenticateToken;
const authorizeRole = (allowedRoles) => {
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
exports.authorizeRole = authorizeRole;
