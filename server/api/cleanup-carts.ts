import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verifica che sia una richiesta POST per sicurezza
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🧹 Starting cart cleanup...");

    // Per il test: 5 minuti (5 * 60 * 1000)
    // Per la produzione: 48 ore (48 * 60 * 60 * 1000)
    const testMode =
      req.query.test === "true" || process.env.NODE_ENV !== "production";
    const cutoffTime = testMode
      ? 5 * 60 * 1000 // 5 minuti per il test
      : 48 * 60 * 60 * 1000; // 48 ore per la produzione

    const cutoff = new Date(Date.now() - cutoffTime);

    console.log(
      `🕒 Cutoff time: ${cutoff.toISOString()} (${testMode ? "5 minutes" : "48 hours"} ago)`
    );

    // Prima conta quanti cart items ci sono
    const totalCartItems = await prisma.cartItem.count();
    console.log(`📊 Total cart items before cleanup: ${totalCartItems}`);

    // Elimina i CartItem più vecchi del cutoff (basato su updatedAt)
    const deletedCartItems = await prisma.cartItem.deleteMany({
      where: {
        updatedAt: { lt: cutoff },
      },
    });

    console.log(`🗑️ Deleted ${deletedCartItems.count} old cart items`);

    // Conta i carrelli vuoti
    const emptyCarts = await prisma.cart.findMany({
      where: {
        items: { none: {} },
      },
      select: { id: true },
    });

    console.log(`📊 Found ${emptyCarts.length} empty carts`);

    // Elimina i carrelli vuoti (senza CartItem)
    const deletedCarts = await prisma.cart.deleteMany({
      where: {
        items: { none: {} },
      },
    });

    console.log(`🗑️ Deleted ${deletedCarts.count} empty carts`);

    const remainingCartItems = await prisma.cartItem.count();
    const remainingCarts = await prisma.cart.count();

    const result = {
      success: true,
      message: "Cart cleanup completed successfully",
      testMode,
      cutoffTime: cutoff.toISOString(),
      deletedCartItems: deletedCartItems.count,
      deletedCarts: deletedCarts.count,
      remainingCartItems,
      remainingCarts,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Cleanup completed:", result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error during cart cleanup:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
}
