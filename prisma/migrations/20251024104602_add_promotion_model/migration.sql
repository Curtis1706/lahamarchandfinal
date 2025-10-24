-- CreateEnum
CREATE TYPE "public"."PromotionStatus" AS ENUM ('ACTIF', 'INACTIF', 'EXPIRE');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "representantId" TEXT;

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "livre" TEXT NOT NULL,
    "statut" "public"."PromotionStatus" NOT NULL DEFAULT 'ACTIF',
    "taux" TEXT NOT NULL,
    "quantiteMinimale" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "public"."Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_code_idx" ON "public"."Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_statut_idx" ON "public"."Promotion"("statut");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_representantId_fkey" FOREIGN KEY ("representantId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
