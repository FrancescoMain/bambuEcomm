/**
 * Crea (o aggiorna) l'account del gestionale libri /scuole, ruolo SCUOLE.
 * Non vale per il pannello del negozio e il pannello non vale per /scuole.
 *
 *   EMAIL=libri@... PASSWORD='...' npx ts-node scripts/creaUtenteScuole.ts
 *
 * La password si passa da variabile d'ambiente per non lasciarla nella cronologia degli argomenti.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL?.trim().toLowerCase();
  const password = process.env.PASSWORD ?? "";
  if (!email || password.length < 10) {
    throw new Error("Servono EMAIL e PASSWORD (almeno 10 caratteri).");
  }
  const esistente = await prisma.user.findUnique({ where: { email } });
  if (esistente && esistente.role !== "SCUOLE") {
    throw new Error(`${email} è già un account del negozio (${esistente.role}): usa un'altra email.`);
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, password: hash, name: "Gestionale scuole", role: "SCUOLE" },
    update: { password: hash },
  });
  console.log(`Account ${user.email} pronto (ruolo SCUOLE, id ${user.id}).`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
