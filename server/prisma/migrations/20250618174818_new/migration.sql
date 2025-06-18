/*
  Warnings:

  - You are about to drop the column `codiceEAN` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `codiceProdotto` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `descrizioneBreve` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stato` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_codiceProdotto_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "codiceEAN",
DROP COLUMN "codiceProdotto",
DROP COLUMN "descrizioneBreve",
DROP COLUMN "stato",
DROP COLUMN "stock",
DROP COLUMN "url";
