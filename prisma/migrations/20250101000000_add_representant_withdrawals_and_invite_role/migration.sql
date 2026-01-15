-- Migration: Add RepresentantWithdrawal model and INVITE role
-- This migration adds only the new changes without affecting existing data

-- Create WithdrawalMethod enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WithdrawalMethod') THEN
    CREATE TYPE "WithdrawalMethod" AS ENUM ('MOMO', 'BANK', 'CASH');
  END IF;
END $$;

-- Create WithdrawalStatus enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WithdrawalStatus') THEN
    CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');
  END IF;
END $$;

-- Add INVITE to Role enum (idempotent: only if Role exists and INVITE not present)
DO $$
BEGIN
  -- Check if Role enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    -- Check if INVITE value already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
      AND enumlabel = 'INVITE'
    ) THEN
      ALTER TYPE "Role" ADD VALUE 'INVITE';
    END IF;
  END IF;
END $$;

-- Create RepresentantWithdrawal table
CREATE TABLE IF NOT EXISTS "RepresentantWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "WithdrawalMethod" NOT NULL,
    "momoNumber" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankAccountName" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepresentantWithdrawal_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "RepresentantWithdrawal_userId_idx" ON "RepresentantWithdrawal"("userId");
CREATE INDEX IF NOT EXISTS "RepresentantWithdrawal_status_idx" ON "RepresentantWithdrawal"("status");
CREATE INDEX IF NOT EXISTS "RepresentantWithdrawal_requestedAt_idx" ON "RepresentantWithdrawal"("requestedAt");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RepresentantWithdrawal_userId_fkey'
    ) THEN
        ALTER TABLE "RepresentantWithdrawal" 
        ADD CONSTRAINT "RepresentantWithdrawal_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RepresentantWithdrawal_validatedById_fkey'
    ) THEN
        ALTER TABLE "RepresentantWithdrawal" 
        ADD CONSTRAINT "RepresentantWithdrawal_validatedById_fkey" 
        FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

