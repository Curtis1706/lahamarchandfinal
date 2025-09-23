import { PrismaClient } from '@prisma/client'

// Force loading environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
