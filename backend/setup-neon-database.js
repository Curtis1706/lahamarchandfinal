const { PrismaClient } = require('@prisma/client')

async function setupNeonDatabase() {
  // Utiliser votre URL Neon
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_wIlBvmJV64xW@ep-late-credit-ad8o01yi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  
  const prisma = new PrismaClient()
  
  try {
    console.log('🏗️ Configuration de la base de données Neon...')
    
    // Créer les tables manuellement avec du SQL brut
    console.log('📊 Création des tables...')
    
    // Table User
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        "image" TEXT,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "disciplineId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `
    console.log('✅ Table User créée')
    
    // Table Account (pour NextAuth)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
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
        "session_state" TEXT
      )
    `
    console.log('✅ Table Account créée')
    
    // Table Session (pour NextAuth)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      )
    `
    console.log('✅ Table Session créée')
    
    // Table Discipline
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Discipline" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE
      )
    `
    console.log('✅ Table Discipline créée')
    
    // Table Work
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Work" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "isbn" TEXT UNIQUE,
        "price" DOUBLE PRECISION NOT NULL,
        "tva" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "minStock" INTEGER NOT NULL DEFAULT 10,
        "maxStock" INTEGER,
        "disciplineId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
        "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "authorId" TEXT,
        "concepteurId" TEXT
      )
    `
    console.log('✅ Table Work créée')
    
    // Table Project
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "disciplineId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
        "submittedAt" TIMESTAMP(3),
        "reviewedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "concepteurId" TEXT NOT NULL,
        "reviewerId" TEXT,
        "workId" TEXT UNIQUE
      )
    `
    console.log('✅ Table Project créée')
    
    // Table Order
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "partnerId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'PENDING'
      )
    `
    console.log('✅ Table Order créée')
    
    // Table OrderItem
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "workId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL
      )
    `
    console.log('✅ Table OrderItem créée')
    
    // Table Partner
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Partner" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT,
        "address" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "contact" TEXT,
        "website" TEXT,
        "description" TEXT,
        "representantId" TEXT,
        "userId" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Table Partner créée')
    
    // Table Royalty
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Royalty" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "paid" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Table Royalty créée')
    
    // Table Sale
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Sale" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Table Sale créée')
    
    // Table StockMovement
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "StockMovement" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "reason" TEXT,
        "reference" TEXT,
        "performedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Table StockMovement créée')
    
    // Table AuditLog
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "action" TEXT NOT NULL,
        "userId" TEXT,
        "performedBy" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Table AuditLog créée')
    
    // Créer les index
    console.log('📈 Création des index...')
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Work_disciplineId_idx" ON "Work"("disciplineId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Work_authorId_idx" ON "Work"("authorId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Work_concepteurId_idx" ON "Work"("concepteurId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Project_disciplineId_idx" ON "Project"("disciplineId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Project_concepteurId_idx" ON "Project"("concepteurId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Project_reviewerId_idx" ON "Project"("reviewerId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Order_partnerId_idx" ON "Order"("partnerId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OrderItem_workId_idx" ON "OrderItem"("workId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Partner_userId_idx" ON "Partner"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Partner_representantId_idx" ON "Partner"("representantId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Royalty_workId_idx" ON "Royalty"("workId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Royalty_userId_idx" ON "Royalty"("userId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Sale_workId_idx" ON "Sale"("workId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StockMovement_workId_idx" ON "StockMovement"("workId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StockMovement_type_idx" ON "StockMovement"("type")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt")`
    console.log('✅ Index créés')
    
    console.log('\n🎉 Base de données Neon configurée avec succès!')
    console.log('✅ Toutes les tables ont été créées')
    console.log('✅ Tous les index ont été créés')
    
    // Test de connexion
    const userCount = await prisma.user.count()
    console.log(`📊 ${userCount} utilisateurs dans la base`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupNeonDatabase()
