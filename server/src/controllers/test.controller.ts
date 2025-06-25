import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const testCleanupCarts = async (req: Request, res: Response) => {
  try {
    console.log("🧪 Testing cart cleanup (5 minutes cutoff)...");

    // Test con 5 minuti
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minuti fa

    console.log(`🕒 Test cutoff time: ${cutoff.toISOString()} (5 minutes ago)`);

    // Prima conta quanti cart items ci sono
    const totalCartItems = await prisma.cartItem.count();
    const totalCarts = await prisma.cart.count();

    console.log(
      `📊 Before cleanup: ${totalCartItems} cart items, ${totalCarts} carts`
    );

    // Mostra i cart items più vecchi di 5 minuti
    const oldCartItems = await prisma.cartItem.findMany({
      where: {
        updatedAt: { lt: cutoff },
      },
      select: {
        id: true,
        updatedAt: true,
        cartId: true,
      },
    });

    console.log(
      `🔍 Found ${oldCartItems.length} cart items older than 5 minutes:`,
      oldCartItems
    );

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
      select: { id: true, createdAt: true, updatedAt: true },
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
      message: "Test cart cleanup completed",
      testMode: true,
      cutoffTime: cutoff.toISOString(),
      before: {
        cartItems: totalCartItems,
        carts: totalCarts,
      },
      deleted: {
        cartItems: deletedCartItems.count,
        carts: deletedCarts.count,
      },
      after: {
        cartItems: remainingCartItems,
        carts: remainingCarts,
      },
      oldCartItemsFound: oldCartItems,
      emptyCartsFound: emptyCarts,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Test cleanup completed:", result);

    res.json(result);
  } catch (error) {
    console.error("❌ Error during test cleanup:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
