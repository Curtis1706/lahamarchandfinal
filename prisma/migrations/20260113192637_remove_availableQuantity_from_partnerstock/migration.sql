-- Migration: Remove availableQuantity from PartnerStock
-- This field was removed because it's now calculated dynamically:
-- availableQuantity = allocatedQuantity - soldQuantity + returnedQuantity
--
-- This migration was applied manually via `prisma db push` on 2026-01-13
-- The field has already been dropped from the database.
--
-- No SQL needed as the change was already applied.


