import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOldCarts() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 ore fa

  // Elimina i CartItem più vecchi di 48 ore (basato su updatedAt)
  await prisma.cartItem.deleteMany({
    where: {
      updatedAt: { lt: cutoff },
    },
  });

  // Elimina i carrelli vuoti (senza CartItem)
  await prisma.cart.deleteMany({
    where: {
      items: { none: {} },
    },
  });
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
