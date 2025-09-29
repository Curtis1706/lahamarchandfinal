-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('PDG', 'REPRESENTANT', 'CONCEPTEUR', 'AUTEUR', 'PARTENAIRE', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."WorkStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ON_SALE', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'TRANSFER', 'DAMAGED', 'EXPIRED', 'PARTNER_ALLOCATION', 'PARTNER_SALE', 'PARTNER_RETURN', 'DIRECT_SALE', 'CORRECTION', 'INVENTORY');

-- CreateEnum
CREATE TYPE "public"."SaleType" AS ENUM ('DIRECT', 'ONLINE', 'PARTNER', 'SCHOOL', 'BULK');

-- CreateEnum
CREATE TYPE "public"."DistributionType" AS ENUM ('SCHOOL', 'LIBRARY', 'PARTNER', 'PROMOTION', 'SAMPLE');

-- CreateEnum
CREATE TYPE "public"."AlertRuleType" AS ENUM ('STOCK_LOW', 'STOCK_OUT', 'SALES_THRESHOLD', 'PRICE_CHANGE', 'EXPIRY_WARNING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('STOCK_LOW', 'STOCK_OUT', 'SALES_SPIKE', 'PRICE_CHANGE', 'EXPIRY_WARNING', 'INTEGRATION_ERROR', 'REPORT_FAILED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('INVENTORY_SUMMARY', 'SALES_ANALYSIS', 'STOCK_MOVEMENTS', 'ALERTS_SUMMARY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('ORDER_SYSTEM', 'ACCOUNTING_SYSTEM', 'WAREHOUSE_SYSTEM', 'ECOMMERCE_PLATFORM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "disciplineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "expectedDeliverables" TEXT,
    "requiredResources" TEXT,
    "timeline" TEXT,
    "rejectionReason" TEXT,
    "disciplineId" TEXT NOT NULL,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "concepteurId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isbn" TEXT NOT NULL,
    "internalCode" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "discountRate" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 10,
    "maxStock" INTEGER,
    "physicalStock" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "targetAudience" TEXT,
    "educationalObjectives" TEXT,
    "contentType" TEXT,
    "keywords" TEXT,
    "files" TEXT,
    "validationComment" TEXT,
    "rejectionReason" TEXT,
    "disciplineId" TEXT NOT NULL,
    "status" "public"."WorkStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "publicationDate" TIMESTAMP(3),
    "version" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "concepteurId" TEXT,
    "projectId" TEXT,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "performedBy" TEXT,
    "partnerId" TEXT,
    "source" TEXT,
    "destination" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "correctionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "website" TEXT,
    "description" TEXT,
    "representantId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PartnerStock" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "allocatedQuantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Royalty" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Royalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MESSAGE',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "performedBy" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkVersion" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkSale" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "saleType" "public"."SaleType" NOT NULL DEFAULT 'DIRECT',
    "customerId" TEXT,
    "orderId" TEXT,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkDistribution" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "distributionType" "public"."DistributionType" NOT NULL DEFAULT 'SCHOOL',
    "recipientId" TEXT,
    "recipientName" TEXT,
    "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkView" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "viewerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockAlertRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AlertRuleType" NOT NULL,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" "public"."AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockAlert" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "workId" TEXT,
    "type" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "parameters" TEXT NOT NULL,
    "schedule" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportExecution" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "result" TEXT,
    "error" TEXT,
    "filePath" TEXT,

    CONSTRAINT "ReportExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."IntegrationType" NOT NULL,
    "config" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "syncStatus" "public"."SyncStatus" NOT NULL DEFAULT 'PENDING',
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Work_isbn_key" ON "public"."Work"("isbn");

-- CreateIndex
CREATE INDEX "StockMovement_workId_idx" ON "public"."StockMovement"("workId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "public"."StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "public"."StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_partnerId_idx" ON "public"."StockMovement"("partnerId");

-- CreateIndex
CREATE INDEX "StockMovement_isCorrection_idx" ON "public"."StockMovement"("isCorrection");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_name_key" ON "public"."Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "public"."Partner"("userId");

-- CreateIndex
CREATE INDEX "PartnerStock_partnerId_idx" ON "public"."PartnerStock"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerStock_workId_idx" ON "public"."PartnerStock"("workId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerStock_partnerId_workId_key" ON "public"."PartnerStock"("partnerId", "workId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "WorkVersion_workId_idx" ON "public"."WorkVersion"("workId");

-- CreateIndex
CREATE INDEX "WorkVersion_version_idx" ON "public"."WorkVersion"("version");

-- CreateIndex
CREATE INDEX "WorkVersion_isActive_idx" ON "public"."WorkVersion"("isActive");

-- CreateIndex
CREATE INDEX "WorkSale_workId_idx" ON "public"."WorkSale"("workId");

-- CreateIndex
CREATE INDEX "WorkSale_saleDate_idx" ON "public"."WorkSale"("saleDate");

-- CreateIndex
CREATE INDEX "WorkSale_saleType_idx" ON "public"."WorkSale"("saleType");

-- CreateIndex
CREATE INDEX "WorkDistribution_workId_idx" ON "public"."WorkDistribution"("workId");

-- CreateIndex
CREATE INDEX "WorkDistribution_distributionDate_idx" ON "public"."WorkDistribution"("distributionDate");

-- CreateIndex
CREATE INDEX "WorkDistribution_distributionType_idx" ON "public"."WorkDistribution"("distributionType");

-- CreateIndex
CREATE INDEX "WorkView_workId_idx" ON "public"."WorkView"("workId");

-- CreateIndex
CREATE INDEX "WorkView_viewedAt_idx" ON "public"."WorkView"("viewedAt");

-- CreateIndex
CREATE INDEX "WorkView_viewerId_idx" ON "public"."WorkView"("viewerId");

-- CreateIndex
CREATE INDEX "StockAlertRule_type_idx" ON "public"."StockAlertRule"("type");

-- CreateIndex
CREATE INDEX "StockAlertRule_isActive_idx" ON "public"."StockAlertRule"("isActive");

-- CreateIndex
CREATE INDEX "StockAlertRule_priority_idx" ON "public"."StockAlertRule"("priority");

-- CreateIndex
CREATE INDEX "StockAlert_type_idx" ON "public"."StockAlert"("type");

-- CreateIndex
CREATE INDEX "StockAlert_severity_idx" ON "public"."StockAlert"("severity");

-- CreateIndex
CREATE INDEX "StockAlert_isRead_idx" ON "public"."StockAlert"("isRead");

-- CreateIndex
CREATE INDEX "StockAlert_isResolved_idx" ON "public"."StockAlert"("isResolved");

-- CreateIndex
CREATE INDEX "StockAlert_createdAt_idx" ON "public"."StockAlert"("createdAt");

-- CreateIndex
CREATE INDEX "StockReport_type_idx" ON "public"."StockReport"("type");

-- CreateIndex
CREATE INDEX "StockReport_isActive_idx" ON "public"."StockReport"("isActive");

-- CreateIndex
CREATE INDEX "StockReport_nextRun_idx" ON "public"."StockReport"("nextRun");

-- CreateIndex
CREATE INDEX "ReportExecution_reportId_idx" ON "public"."ReportExecution"("reportId");

-- CreateIndex
CREATE INDEX "ReportExecution_status_idx" ON "public"."ReportExecution"("status");

-- CreateIndex
CREATE INDEX "ReportExecution_startedAt_idx" ON "public"."ReportExecution"("startedAt");

-- CreateIndex
CREATE INDEX "StockIntegration_type_idx" ON "public"."StockIntegration"("type");

-- CreateIndex
CREATE INDEX "StockIntegration_isActive_idx" ON "public"."StockIntegration"("isActive");

-- CreateIndex
CREATE INDEX "StockIntegration_syncStatus_idx" ON "public"."StockIntegration"("syncStatus");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_concepteurId_fkey" FOREIGN KEY ("concepteurId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_concepteurId_fkey" FOREIGN KEY ("concepteurId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Partner" ADD CONSTRAINT "Partner_representantId_fkey" FOREIGN KEY ("representantId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Partner" ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerStock" ADD CONSTRAINT "PartnerStock_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PartnerStock" ADD CONSTRAINT "PartnerStock_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Royalty" ADD CONSTRAINT "Royalty_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Royalty" ADD CONSTRAINT "Royalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkVersion" ADD CONSTRAINT "WorkVersion_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkVersion" ADD CONSTRAINT "WorkVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSale" ADD CONSTRAINT "WorkSale_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSale" ADD CONSTRAINT "WorkSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkDistribution" ADD CONSTRAINT "WorkDistribution_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkView" ADD CONSTRAINT "WorkView_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkView" ADD CONSTRAINT "WorkView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAlertRule" ADD CONSTRAINT "StockAlertRule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAlert" ADD CONSTRAINT "StockAlert_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."StockAlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAlert" ADD CONSTRAINT "StockAlert_workId_fkey" FOREIGN KEY ("workId") REFERENCES "public"."Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockAlert" ADD CONSTRAINT "StockAlert_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockReport" ADD CONSTRAINT "StockReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportExecution" ADD CONSTRAINT "ReportExecution_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."StockReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockIntegration" ADD CONSTRAINT "StockIntegration_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
