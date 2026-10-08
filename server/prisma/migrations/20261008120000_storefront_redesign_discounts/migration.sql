-- Redesign negozio: sconti prodotto, galleria, marche, impostazioni, wishlist,
-- newsletter, avvisi disponibilità, recensioni, messaggi, recesso online, blog.
-- Migrazione solo additiva: nessuna tabella o colonna viene eliminata.
-- Gli unici DROP INDEX sostituiscono i vincoli univoci di carrello/ordine con
-- versioni che includono le varianti (stesso prodotto in colori diversi).

-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- DropIndex
DROP INDEX "OrderItem_orderId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "personalizzazione" TEXT,
ADD COLUMN     "variantKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "immagine" TEXT,
ADD COLUMN     "ordine" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "codiceCoupon" TEXT,
ADD COLUMN     "codiceFiscale" TEXT,
ADD COLUMN     "codiceSdi" TEXT,
ADD COLUMN     "commissionePagamento" DECIMAL(10,2),
ADD COLUMN     "costoSpedizione" DECIMAL(10,2),
ADD COLUMN     "emailInviataAt" TIMESTAMP(3),
ADD COLUMN     "metodoConsegna" TEXT,
ADD COLUMN     "metodoPagamento" TEXT,
ADD COLUMN     "partitaIva" TEXT,
ADD COLUMN     "pec" TEXT,
ADD COLUMN     "promotionId" INTEGER,
ADD COLUMN     "ragioneSociale" TEXT,
ADD COLUMN     "richiestaFattura" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sconto" DECIMAL(10,2),
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "subtotale" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "personalizzazione" TEXT,
ADD COLUMN     "prezzoListino" DECIMAL(10,2),
ADD COLUMN     "titolo" TEXT,
ADD COLUMN     "variantKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "codice" TEXT,
ADD COLUMN     "etichettaPersonalizzazione" TEXT,
ADD COLUMN     "immagini" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "inEvidenza" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marca" TEXT,
ADD COLUMN     "maxPerOrdine" INTEGER,
ADD COLUMN     "personalizzabile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prezzoScontato" DECIMAL(10,2),
ADD COLUMN     "scontoFine" TIMESTAMP(3),
ADD COLUMN     "scontoInizio" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "maxUtilizzi" INTEGER,
ADD COLUMN     "minimoOrdine" DECIMAL(10,2),
ADD COLUMN     "utilizzi" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER,
    "nome" TEXT NOT NULL,
    "voto" INTEGER NOT NULL,
    "testo" TEXT,
    "approvata" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'contatto',
    "dati" JSONB,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "oggetto" TEXT,
    "messaggio" TEXT NOT NULL,
    "letto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "articoli" JSONB NOT NULL,
    "motivo" TEXT,
    "note" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'ricevuta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "titolo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "estratto" TEXT,
    "contenuto" TEXT NOT NULL,
    "copertina" TEXT,
    "pubblicato" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE INDEX "StockAlert_productId_notifiedAt_idx" ON "StockAlert"("productId", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_email_productId_key" ON "StockAlert"("email", "productId");

-- CreateIndex
CREATE INDEX "Review_productId_approvata_idx" ON "Review"("productId", "approvata");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_orderId_idx" ON "WithdrawalRequest"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_pubblicato_publishedAt_idx" ON "Post"("pubblicato", "publishedAt");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE INDEX "CartItem_updatedAt_idx" ON "CartItem"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantKey_key" ON "CartItem"("cartId", "productId", "variantKey");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_guestEmail_idx" ON "Order"("guestEmail");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_variantKey_key" ON "OrderItem"("orderId", "productId", "variantKey");

-- CreateIndex
CREATE INDEX "Product_available_createdAt_idx" ON "Product"("available", "createdAt");

-- CreateIndex
CREATE INDEX "Product_prezzoScontato_idx" ON "Product"("prezzoScontato");

-- CreateIndex
CREATE INDEX "Product_inEvidenza_idx" ON "Product"("inEvidenza");

-- CreateIndex
CREATE INDEX "Product_marca_idx" ON "Product"("marca");

-- CreateIndex
CREATE INDEX "ProductVariantType_productId_idx" ON "ProductVariantType"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantValue_typeId_idx" ON "ProductVariantValue"("typeId");

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

