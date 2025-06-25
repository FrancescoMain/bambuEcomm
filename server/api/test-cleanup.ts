import { VercelRequest, VercelResponse } from "@vercel/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Supporta sia GET che POST per facilità di test
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🧪 Manual test cleanup triggered...");
    
    // Sempre in modalità test per questo endpoint
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minuti fa
    
    console.log(`🕒 Test cutoff time: ${cutoff.toISOString()} (5 minutes ago)`);

    // Prima conta quanti cart items ci sono
    const totalCartItems = await prisma.cartItem.count();
    const totalCarts = await prisma.cart.count();
    console.log(`📊 Before cleanup: ${totalCartItems} cart items, ${totalCarts} carts`);

    // Mostra dettagli dei cart items che verranno eliminati
    const oldCartItems = await prisma.cartItem.findMany({
      where: {
        updatedAt: { lt: cutoff },
      },
      select: {
        id: true,
        updatedAt: true,
        cartId: true,
        productId: true,
        quantity: true,
      },
    });

    console.log(`🔍 Found ${oldCartItems.length} cart items older than 5 minutes:`, oldCartItems);

    // Elimina i CartItem più vecchi di 5 minuti
    const deletedCartItems = await prisma.cartItem.deleteMany({
      where: {
        updatedAt: { lt: cutoff },
      },
    });

    console.log(`🗑️ Deleted ${deletedCartItems.count} old cart items`);

    // Trova carrelli vuoti
    const emptyCarts = await prisma.cart.findMany({
      where: {
        items: { none: {} },
      },
      select: { id: true, userId: true, createdAt: true, updatedAt: true }
    });

    console.log(`🔍 Found ${emptyCarts.length} empty carts:`, emptyCarts);

    // Elimina i carrelli vuoti
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
      message: "Manual test cleanup completed",
      testMode: true,
      cutoffTime: cutoff.toISOString(),
      before: {
        cartItems: totalCartItems,
        carts: totalCarts
      },
      deleted: {
        cartItems: deletedCartItems.count,
        carts: deletedCarts.count
      },
      after: {
        cartItems: remainingCartItems,
        carts: remainingCarts
      },
      details: {
        oldCartItemsFound: oldCartItems,
        emptyCartsFound: emptyCarts,
      },
      timestamp: new Date().toISOString()
    };

    console.log("✅ Manual test cleanup completed:", result);

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Error during manual test cleanup:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    await prisma.$disconnect();
  }
}
