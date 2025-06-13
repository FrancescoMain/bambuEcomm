import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import addressRoutes from "./routes/address.routes";
import cartRoutes from "./routes/cart.routes"; // Import cart routes
import promotionRoutes from "./routes/promotion.routes"; // Import promotion routes
import notificationRoutes from "./routes/notification.routes"; // Import notification routes
import productImportRoutes from "./routes/productImport.routes"; // Import product import routes
import checkoutRoutes from "./routes/checkout.routes"; // Import checkout routes
import webhookRoutes from "./routes/webhook.routes"; // Import webhook routes

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors()); // Abilita CORS per tutte le richieste
app.use(express.json()); // Per parsare il body delle richieste JSON
app.use(express.urlencoded({ extended: true })); // Per parsare il body delle richieste URL-encoded

// Middleware per loggare le richieste (opzionale ma utile per il debug)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rotta di test
app.get("/", (req: Request, res: Response) => {
  res.send("Benvenuto nel server API dell'e-commerce!");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes); // Mount cart routes
app.use("/api/promotions", promotionRoutes); // Mount promotion routes
app.use("/api/notifications", notificationRoutes); // Mount notification routes
app.use("/api/products", productImportRoutes); // Mount product import routes
app.use("/api", checkoutRoutes); // Mount checkout routes
app.use("/api", webhookRoutes); // Mount webhook routes
// TODO: Aggiungere le altre rotte (notifications)

// Gestione errori globale (semplice)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Qualcosa è andato storto!");
});

async function main() {
  // Logica di avvio, es. connessione al DB (Prisma gestisce la connessione lazy)
  console.log("Prisma Client inizializzato.");

  app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
  });
}

main().catch(async (e) => {
  console.error("Errore durante l'avvio del server:", e);
  await prisma.$disconnect();
  process.exit(1);
});

export default app; // Utile per test futuri
