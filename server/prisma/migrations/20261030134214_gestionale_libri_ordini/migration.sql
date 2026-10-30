-- CreateTable
CREATE TABLE "OrdineFornitore" (
    "id" SERIAL NOT NULL,
    "anno" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdineFornitore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdineRiga" (
    "id" SERIAL NOT NULL,
    "ordineId" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "materia" TEXT NOT NULL,
    "autori" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "editore" TEXT NOT NULL,
    "prezzo" DECIMAL(10,2) NOT NULL,
    "libroId" INTEGER,
    "arrivatoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdineRiga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdineFornitore_anno_numero_key" ON "OrdineFornitore"("anno", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "OrdineRiga_libroId_key" ON "OrdineRiga"("libroId");

-- CreateIndex
CREATE INDEX "OrdineRiga_ordineId_idx" ON "OrdineRiga"("ordineId");

-- CreateIndex
CREATE INDEX "OrdineRiga_isbn_arrivatoAt_idx" ON "OrdineRiga"("isbn", "arrivatoAt");

-- AddForeignKey
ALTER TABLE "OrdineRiga" ADD CONSTRAINT "OrdineRiga_ordineId_fkey" FOREIGN KEY ("ordineId") REFERENCES "OrdineFornitore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdineRiga" ADD CONSTRAINT "OrdineRiga_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "SchedaClienteLibro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
