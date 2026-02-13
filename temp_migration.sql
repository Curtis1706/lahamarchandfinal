-- AlterTable
ALTER TABLE "public"."DeliveryNote" ADD COLUMN     "datePrevue" TIMESTAMP(3),
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "etatLivres" TEXT,
ADD COLUMN     "motif" TEXT,
ADD COLUMN     "transport" TEXT;

