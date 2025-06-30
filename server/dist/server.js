"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes")); // Import cart routes
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes")); // Import promotion routes
const notification_routes_1 = __importDefault(require("./routes/notification.routes")); // Import notification routes
const productImport_routes_1 = __importDefault(require("./routes/productImport.routes")); // Import product import routes
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes")); // Import checkout routes
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes")); // Import webhook routes
const variant_routes_1 = __importDefault(require("./routes/variant.routes")); // Import variant routes
const email_routes_1 = __importDefault(require("./routes/email.routes")); // Import email routes
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes")); // Import dashboard routes
const test_controller_1 = require("./controllers/test.controller"); // Import test controller
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const prisma = new client_1.PrismaClient();
// Middleware
app.use("/api", webhook_routes_1.default); // Mount webhook routes PRIMA di express.json()
app.use((0, cors_1.default)()); // Abilita CORS per tutte le richieste
app.use(express_1.default.json()); // Per parsare il body delle richieste JSON
app.use(express_1.default.urlencoded({ extended: true })); // Per parsare il body delle richieste URL-encoded
// Middleware per loggare le richieste (opzionale ma utile per il debug)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Rotta di test
app.get("/", (req, res) => {
    res.send("Benvenuto nel server API dell'e-commerce!");
});
// API Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api/addresses", address_routes_1.default);
app.use("/api/cart", cart_routes_1.default); // Mount cart routes
app.use("/api/promotions", promotion_routes_1.default); // Mount promotion routes
app.use("/api/notifications", notification_routes_1.default); // Mount notification routes
app.use("/api/products", productImport_routes_1.default); // Mount product import routes
app.use("/api", checkout_routes_1.default); // Mount checkout routes
app.use("/api/variants", variant_routes_1.default); // Mount variant routes
app.use("/api/email", email_routes_1.default); // Mount email routes
app.use("/api/dashboard", dashboard_routes_1.default); // Mount dashboard routes
// Test routes (solo per sviluppo/debug)
app.post("/api/test/cleanup-carts", test_controller_1.testCleanupCarts);
// TODO: Aggiungere le altre rotte (notifications)
// Gestione errori globale (semplice)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
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
exports.default = app; // Utile per test futuri
