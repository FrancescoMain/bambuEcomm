/*
  Warnings:

  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isBestSeller` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codiceProdotto]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codiceProdotto` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prezzo` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titolo` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "isBestSeller",
DROP COLUMN "isFeatured",
DROP COLUMN "name",
DROP COLUMN "price",
ADD COLUMN     "codiceEAN" TEXT,
ADD COLUMN     "codiceProdotto" TEXT NOT NULL,
ADD COLUMN     "descrizione" TEXT,
ADD COLUMN     "descrizioneBreve" TEXT,
ADD COLUMN     "immagine" TEXT,
ADD COLUMN     "prezzo" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "stato" TEXT,
ADD COLUMN     "titolo" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_codiceProdotto_key" ON "Product"("codiceProdotto");
