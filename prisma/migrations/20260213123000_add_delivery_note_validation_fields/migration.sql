-- AlterTable
ALTER TABLE "DeliveryNote" ADD COLUMN     "motif" TEXT,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "etatLivres" TEXT,
ADD COLUMN     "transport" TEXT,
ADD COLUMN     "datePrevue" TIMESTAMP(3);
