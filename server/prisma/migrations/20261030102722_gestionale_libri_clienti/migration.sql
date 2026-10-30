-- CreateEnum
CREATE TYPE "StatoLibroCliente" AS ENUM ('IN_LISTA', 'PRENOTATO', 'CONFERMATO', 'ASSEGNATO', 'RITIRATO');

-- CreateTable
CREATE TABLE "SchedaCliente" (
    "id" SERIAL NOT NULL,
    "anno" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "cognome" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "scuolaId" INTEGER NOT NULL,
    "classe" TEXT NOT NULL,
    "corso" TEXT NOT NULL DEFAULT '',
    "acconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedaClienteLibro" (
    "id" SERIAL NOT NULL,
    "schedaId" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "autori" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "editore" TEXT NOT NULL,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "nuovaAdozione" BOOLEAN NOT NULL DEFAULT false,
    "daAcquistare" BOOLEAN NOT NULL DEFAULT false,
    "consigliato" BOOLEAN NOT NULL DEFAULT false,
    "stato" "StatoLibroCliente" NOT NULL DEFAULT 'IN_LISTA',
    "prenotatoAt" TIMESTAMP(3),
    "confermatoAt" TIMESTAMP(3),
    "assegnatoAt" TIMESTAMP(3),
    "ritiratoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedaClienteLibro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchedaCliente_scuolaId_anno_classe_idx" ON "SchedaCliente"("scuolaId", "anno", "classe");

-- CreateIndex
CREATE INDEX "SchedaCliente_cognome_idx" ON "SchedaCliente"("cognome");

-- CreateIndex
CREATE UNIQUE INDEX "SchedaCliente_anno_numero_key" ON "SchedaCliente"("anno", "numero");

-- CreateIndex
CREATE INDEX "SchedaClienteLibro_isbn_stato_idx" ON "SchedaClienteLibro"("isbn", "stato");

-- CreateIndex
CREATE UNIQUE INDEX "SchedaClienteLibro_schedaId_isbn_key" ON "SchedaClienteLibro"("schedaId", "isbn");

-- AddForeignKey
ALTER TABLE "SchedaCliente" ADD CONSTRAINT "SchedaCliente_scuolaId_fkey" FOREIGN KEY ("scuolaId") REFERENCES "Scuola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedaClienteLibro" ADD CONSTRAINT "SchedaClienteLibro_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "SchedaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
