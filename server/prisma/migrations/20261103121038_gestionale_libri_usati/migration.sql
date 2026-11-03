-- AlterTable
ALTER TABLE "SchedaClienteLibro" ADD COLUMN     "prezzoUsato" DECIMAL(10,2),
ADD COLUMN     "usato" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usatoDal" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Venditore" (
    "id" SERIAL NOT NULL,
    "cognome" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venditore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopiaUsata" (
    "id" SERIAL NOT NULL,
    "codice" TEXT NOT NULL,
    "venditoreId" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "autori" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "editore" TEXT NOT NULL,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "scontoVendita" DECIMAL(5,2) NOT NULL,
    "prezzoVendita" DECIMAL(10,2) NOT NULL,
    "percentualeAcquisto" DECIMAL(5,2) NOT NULL,
    "prezzoAcquisto" DECIMAL(10,2) NOT NULL,
    "libroId" INTEGER,
    "assegnataAt" TIMESTAMP(3),
    "pagataAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopiaUsata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venditore_cognome_idx" ON "Venditore"("cognome");

-- CreateIndex
CREATE UNIQUE INDEX "CopiaUsata_codice_key" ON "CopiaUsata"("codice");

-- CreateIndex
CREATE UNIQUE INDEX "CopiaUsata_libroId_key" ON "CopiaUsata"("libroId");

-- CreateIndex
CREATE INDEX "CopiaUsata_isbn_libroId_idx" ON "CopiaUsata"("isbn", "libroId");

-- CreateIndex
CREATE INDEX "CopiaUsata_venditoreId_idx" ON "CopiaUsata"("venditoreId");

-- AddForeignKey
ALTER TABLE "CopiaUsata" ADD CONSTRAINT "CopiaUsata_venditoreId_fkey" FOREIGN KEY ("venditoreId") REFERENCES "Venditore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopiaUsata" ADD CONSTRAINT "CopiaUsata_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "SchedaClienteLibro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
