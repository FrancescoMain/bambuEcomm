-- CreateTable
CREATE TABLE "Scuola" (
    "id" SERIAL NOT NULL,
    "codice" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "indirizzo" TEXT,
    "cap" TEXT,
    "citta" TEXT,
    "provincia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scuola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedaScuola" (
    "id" SERIAL NOT NULL,
    "scuolaId" INTEGER NOT NULL,
    "anno" INTEGER NOT NULL,
    "classe" TEXT NOT NULL,
    "corso" TEXT NOT NULL DEFAULT '',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedaScuola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedaScuolaLibro" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedaScuolaLibro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Scuola_codice_key" ON "Scuola"("codice");

-- CreateIndex
CREATE INDEX "SchedaScuola_anno_idx" ON "SchedaScuola"("anno");

-- CreateIndex
CREATE UNIQUE INDEX "SchedaScuola_scuolaId_anno_classe_corso_key" ON "SchedaScuola"("scuolaId", "anno", "classe", "corso");

-- CreateIndex
CREATE INDEX "SchedaScuolaLibro_isbn_idx" ON "SchedaScuolaLibro"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "SchedaScuolaLibro_schedaId_isbn_key" ON "SchedaScuolaLibro"("schedaId", "isbn");

-- AddForeignKey
ALTER TABLE "SchedaScuola" ADD CONSTRAINT "SchedaScuola_scuolaId_fkey" FOREIGN KEY ("scuolaId") REFERENCES "Scuola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedaScuolaLibro" ADD CONSTRAINT "SchedaScuolaLibro_schedaId_fkey" FOREIGN KEY ("schedaId") REFERENCES "SchedaScuola"("id") ON DELETE CASCADE ON UPDATE CASCADE;
