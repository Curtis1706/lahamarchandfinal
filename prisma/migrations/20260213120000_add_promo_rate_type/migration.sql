-- CreateEnum
CREATE TYPE "public"."RateType" AS ENUM ('PERCENTAGE', 'AMOUNT');

-- AlterTable
ALTER TABLE "public"."Promotion" ADD COLUMN     "applyToAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rateType" "public"."RateType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "rateValue" DOUBLE PRECISION,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "public"."_WorkPromotions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkPromotions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WorkPromotions_B_index" ON "public"."_WorkPromotions"("B");

-- AddForeignKey
ALTER TABLE "public"."_WorkPromotions" ADD CONSTRAINT "_WorkPromotions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_WorkPromotions" ADD CONSTRAINT "_WorkPromotions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
