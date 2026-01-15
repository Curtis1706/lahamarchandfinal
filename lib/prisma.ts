import { PrismaClient } from '@prisma/client'

// Force loading environment variables
if (!process.env.DATABASE_URL) {
  require('dotenv').config()
}

/**
 * CONFIGURATION DU CONNECTION POOLING
 * 
 * Ajoutez ces paramètres à votre DATABASE_URL dans .env :
 * 
 * DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10"
 * 
 * Paramètres :
 * - connection_limit=10 : Max 10 connexions par instance Next.js
 *   Calcul : (Nombre de CPU × 2) + 1 (ex: 4 CPU → 9 connexions)
 * - pool_timeout=20 : Attend 20s pour avoir une connexion disponible
 * - connect_timeout=10 : Timeout de connexion à 10s
 * 
 * Pour Neon/PostgreSQL, limitez à 70-140 connexions au total selon votre plan.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Configuration du pool (les paramètres sont dans DATABASE_URL)
  // connection_limit, pool_timeout, connect_timeout sont gérés via l'URL
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Prisma Client initialized with connection pool')
}
