"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredTokens = exports.resetPassword = exports.requestPasswordReset = exports.getCurrentUserProfile = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailService_1 = __importDefault(require("../services/emailService"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable in production
// Registrazione di un nuovo utente
const registerUser = async (req, res, next) => {
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
            const emailSent = await emailService_1.default.sendWelcomeEmail({
                name: user.name || "Utente",
                email: user.email,
            });
            if (emailSent) {
                console.log(`✅ Email di benvenuto inviata con successo a: ${user.email}`);
            }
            else {
                console.log(`⚠️ Fallimento invio email di benvenuto a: ${user.email}`);
            }
        }
        catch (emailError) {
            console.error("❌ Errore durante invio email benvenuto:", emailError);
            // Non interrompiamo la registrazione se l'email fallisce
        }
        // Exclude password from the response
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            message: "Utente registrato con successo",
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error("Errore di registrazione:", error);
        res.status(500).json({
            message: "Errore durante la registrazione dell\\'utente",
            error: error.message,
        });
    }
};
exports.registerUser = registerUser;
// Login di un utente esistente
const loginUser = async (req, res, next) => {
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ message: "Credenziali non valide" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "24h",
        });
        // Exclude password from the response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: "Login effettuato con successo",
            token,
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error("Errore di login:", error);
        res.status(500).json({
            message: "Errore durante il login",
            error: error.message,
        });
    }
};
exports.loginUser = loginUser;
// Logout dell\\'utente
const logoutUser = async (req, res, next) => {
    try {
        // TODO: Implementare la logica di logout (es. invalidare token se si usa una blacklist)
        res.json({
            message: "Logout effettuato con successo. Per favore, cancella il token.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logoutUser = logoutUser;
// Ottenere il profilo dell\\'utente corrente (richiede autenticazione)
const getCurrentUserProfile = async (req, res, next) => {
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
    }
    catch (error) {
        console.error("Errore nel recupero dell\\'utente corrente:", error);
        res.status(500).json({
            message: "Errore durante il recupero dei dati dell\\'utente",
            error: error.message,
        });
    }
};
exports.getCurrentUserProfile = getCurrentUserProfile;
/**
 * Richiesta reset password - genera token e invia email
 */
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: "Email è obbligatoria" });
        return;
    }
    try {
        // Verifica se l'utente esiste
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Per sicurezza, non rivelare se l'email esiste o meno
            res.json({
                message: "Se l'email esiste nel sistema, riceverai un link per il reset della password",
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
            const emailSent = await emailService_1.default.sendPasswordResetEmail({
                name: user.name || "Utente",
                email: user.email,
                resetToken,
                resetUrl,
            });
            if (emailSent) {
                console.log(`✅ Email reset password inviata a: ${user.email}`);
            }
            else {
                console.log(`⚠️ Fallimento invio email reset password a: ${user.email}`);
            }
        }
        catch (emailError) {
            console.error("❌ Errore durante invio email reset:", emailError);
        }
        res.json({
            message: "Se l'email esiste nel sistema, riceverai un link per il reset della password",
        });
    }
    catch (error) {
        console.error("Errore nella richiesta reset password:", error);
        res.status(500).json({
            message: "Errore durante la richiesta di reset password",
            error: error.message,
        });
    }
};
exports.requestPasswordReset = requestPasswordReset;
/**
 * Reset password - verifica token e aggiorna password
 */
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        res
            .status(400)
            .json({ message: "Token e nuova password sono obbligatori" });
        return;
    }
    if (newPassword.length < 6) {
        res
            .status(400)
            .json({ message: "La password deve essere almeno di 6 caratteri" });
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
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
        console.log(`✅ Password resettata con successo per utente: ${resetToken.user.email}`);
        res.json({ message: "Password aggiornata con successo" });
    }
    catch (error) {
        console.error("Errore nel reset password:", error);
        res.status(500).json({
            message: "Errore durante il reset della password",
            error: error.message,
        });
    }
};
exports.resetPassword = resetPassword;
/**
 * Pulizia token scaduti (da chiamare periodicamente)
 */
const cleanupExpiredTokens = async () => {
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
    }
    catch (error) {
        console.error("Errore nella pulizia dei token:", error);
    }
};
exports.cleanupExpiredTokens = cleanupExpiredTokens;
/**
 * Genera un token sicuro per il reset password
 */
function generateSecureToken() {
    const crypto = require("crypto");
    return crypto.randomBytes(32).toString("hex");
}
