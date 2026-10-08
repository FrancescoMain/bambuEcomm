import { PrismaClient } from "@prisma/client";

// Un solo client (e quindi un solo pool di connessioni) per processo.
// Su Vercel ogni istanza serverless riusa questo client tra le invocazioni;
// in sviluppo sopravvive al reload di nodemon/ts-node.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
