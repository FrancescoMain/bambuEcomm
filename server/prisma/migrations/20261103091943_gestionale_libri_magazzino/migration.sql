-- CreateEnum
CREATE TYPE "CausaleGiacenza" AS ENUM ('CARICO', 'RETTIFICA', 'DATO_AL_CLIENTE', 'RIENTRO');

-- AlterTable
ALTER TABLE "SchedaClienteLibro" ADD COLUMN     "dalNegozioAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GiacenzaLibro" (
    "id" SERIAL NOT NULL,
    "isbn" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "autori" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "editore" TEXT NOT NULL,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "quantita" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiacenzaLibro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoGiacenza" (
    "id" SERIAL NOT NULL,
    "giacenzaId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "causale" "CausaleGiacenza" NOT NULL,
    "libroId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoGiacenza_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiacenzaLibro_isbn_key" ON "GiacenzaLibro"("isbn");

-- CreateIndex
CREATE INDEX "MovimentoGiacenza_giacenzaId_createdAt_idx" ON "MovimentoGiacenza"("giacenzaId", "createdAt");

-- AddForeignKey
ALTER TABLE "MovimentoGiacenza" ADD CONSTRAINT "MovimentoGiacenza_giacenzaId_fkey" FOREIGN KEY ("giacenzaId") REFERENCES "GiacenzaLibro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- La giacenza non va mai sotto zero: due postazioni che danno l'ultima copia non la danno due volte
ALTER TABLE "GiacenzaLibro" ADD CONSTRAINT "GiacenzaLibro_quantita_check" CHECK ("quantita" >= 0);
