import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOldCarts() {
  // Per il test: 5 minuti (commenta/sccommenta per passare tra test e produzione)
  const testMode = true; // Imposta a false per la produzion
  const cutoffTime = testMode
    ? 5 * 60 * 1000 // 5 minuti per il tes
    : 48 * 60 * 60 * 1000; // 48 ore per la produzione

  const cutoff = new Date(Date.now() - cutoffTime);

  console.log(`🧹 Starting cart cleanup...`);
  console.log(
    `🕒 Cutoff time: ${cutoff.toISOString()} (${testMode ? "5 minutes" : "48 hours"} ago)`
  );

  // Conta prima della pulizia
  const totalCartItems = await prisma.cartItem.count();
  const totalCarts = await prisma.cart.count();
  console.log(
    `📊 Before cleanup: ${totalCartItems} cart items, ${totalCarts} carts`
  );

  // Elimina i CartItem più vecchi del cutoff (basato su updatedAt)
  const deletedCartItems = await prisma.cartItem.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
    },
  });

  console.log(`🗑️ Deleted ${deletedCartItems.count} old cart items`);

  // Elimina i carrelli vuoti (senza CartItem)
  const deletedCarts = await prisma.cart.deleteMany({
    where: {
      items: { none: {} },
    },
  });

  console.log(`🗑️ Deleted ${deletedCarts.count} empty carts`);

  const remainingCartItems = await prisma.cartItem.count();
  const remainingCarts = await prisma.cart.count();
  console.log(
    `📊 After cleanup: ${remainingCartItems} cart items, ${remainingCarts} carts`
  );
}

cleanupOldCarts()
  .then(() => {
    console.log("Cleanup carrelli completato");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
