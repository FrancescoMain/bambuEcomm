-- CreateEnum
CREATE TYPE "DestinazioneArrivo" AS ENUM ('CLIENTE', 'MAGAZZINO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CausaleGiacenza" ADD VALUE 'ARRIVO';
ALTER TYPE "CausaleGiacenza" ADD VALUE 'ARRIVO_ANNULLATO';

-- AlterTable
ALTER TABLE "MovimentoGiacenza" ADD COLUMN     "bollaId" INTEGER;

-- CreateTable
CREATE TABLE "BollaArrivo" (
    "id" SERIAL NOT NULL,
    "anno" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroFornitore" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BollaArrivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BollaRiga" (
    "id" SERIAL NOT NULL,
    "bollaId" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "autori" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "editore" TEXT NOT NULL,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "destinazione" "DestinazioneArrivo" NOT NULL,
    "ordineRigaId" INTEGER,
    "libroId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BollaRiga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BollaArrivo_anno_numero_key" ON "BollaArrivo"("anno", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "BollaRiga_ordineRigaId_key" ON "BollaRiga"("ordineRigaId");

-- CreateIndex
CREATE UNIQUE INDEX "BollaRiga_libroId_key" ON "BollaRiga"("libroId");

-- CreateIndex
CREATE INDEX "BollaRiga_bollaId_idx" ON "BollaRiga"("bollaId");

-- CreateIndex
CREATE INDEX "BollaRiga_isbn_idx" ON "BollaRiga"("isbn");

-- AddForeignKey
ALTER TABLE "BollaRiga" ADD CONSTRAINT "BollaRiga_bollaId_fkey" FOREIGN KEY ("bollaId") REFERENCES "BollaArrivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BollaRiga" ADD CONSTRAINT "BollaRiga_ordineRigaId_fkey" FOREIGN KEY ("ordineRigaId") REFERENCES "OrdineRiga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BollaRiga" ADD CONSTRAINT "BollaRiga_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "SchedaClienteLibro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
