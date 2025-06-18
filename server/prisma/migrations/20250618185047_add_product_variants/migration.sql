-- CreateTable
CREATE TABLE "ProductVariantType" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ProductVariantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantValue" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "immagine" TEXT,
    "typeId" INTEGER NOT NULL,

    CONSTRAINT "ProductVariantValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductVariantType" ADD CONSTRAINT "ProductVariantType_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantValue" ADD CONSTRAINT "ProductVariantValue_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ProductVariantType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
