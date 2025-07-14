-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "selectedVariants" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "selectedVariants" JSONB;
