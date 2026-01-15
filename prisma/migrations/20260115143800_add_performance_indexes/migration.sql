-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_createdAt_idx" ON "public"."Client"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_representantId_statut_idx" ON "public"."Client"("representantId", "statut");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "public"."Order"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_workId_idx" ON "public"."OrderItem"("workId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerRebate_workId_idx" ON "public"."PartnerRebate"("workId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PartnerStock_createdAt_idx" ON "public"."PartnerStock"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_partnerId_type_idx" ON "public"."StockMovement"("partnerId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_partnerId_type_createdAt_idx" ON "public"."StockMovement"("partnerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StockMovement_workId_type_idx" ON "public"."StockMovement"("workId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_representantId_idx" ON "public"."User"("representantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_disciplineId_idx" ON "public"."User"("disciplineId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_status_idx" ON "public"."Work"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_authorId_idx" ON "public"."Work"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_disciplineId_idx" ON "public"."Work"("disciplineId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_projectId_idx" ON "public"."Work"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Work_publishedAt_idx" ON "public"."Work"("publishedAt");

