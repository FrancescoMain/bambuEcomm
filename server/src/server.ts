import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import addressRoutes from "./routes/address.routes";
import cartRoutes from "./routes/cart.routes";
import promotionRoutes from "./routes/promotion.routes";
import notificationRoutes from "./routes/notification.routes";
import productImportRoutes from "./routes/productImport.routes";
import checkoutRoutes from "./routes/checkout.routes";
import webhookRoutes from "./routes/webhook.routes";
import variantRoutes from "./routes/variant.routes";
import emailRoutes from "./routes/email.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import settingsRoutes from "./routes/settings.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import newsletterRoutes from "./routes/newsletter.routes";
import contactRoutes from "./routes/contact.routes";
import couponRoutes from "./routes/coupon.routes";
import reviewRoutes from "./routes/review.routes";
import recessoRoutes from "./routes/recesso.routes";
import postRoutes from "./routes/post.routes";
import { testCleanupCarts } from "./controllers/test.controller";
import {
  authenticateToken,
  authorizeRole,
} from "./middleware/auth.middleware";
import prisma from "./lib/prisma";

const app: Express = express();
const port = process.env.PORT || 5000;

app.disable("x-powered-by");

// Il webhook Stripe ha bisogno del body raw: va montato PRIMA di express.json()
app.use("/api", webhookRoutes);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Log solo di richieste lente o fallite: il log di ogni richiesta costa tempo
// e rende illeggibili i log di Vercel.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (ms > 800 || res.statusCode >= 500) {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Benvenuto nel server API dell'e-commerce!");
});

// Health check usato anche per "scaldare" la funzione serverless
app.get("/api/health", async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, dbMs: Date.now() - start, region: process.env.VERCEL_REGION || null });
  } catch (error) {
    res.status(503).json({ ok: false, error: (error as Error).message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productImportRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", checkoutRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recesso", recessoRoutes);
app.use("/api/posts", postRoutes);

// Endpoint di debug: cancella carrelli, quindi solo per admin
app.post(
  "/api/test/cleanup-carts",
  authenticateToken,
  authorizeRole(["ADMIN"]),
  testCleanupCarts
);

// Gestione errori globale
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Qualcosa è andato storto!" });
});

// In locale avviamo il server; su Vercel l'app viene esportata come handler.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
  });
}

export default app;
