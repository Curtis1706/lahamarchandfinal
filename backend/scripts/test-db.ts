import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')
    
    // Test simple de connexion
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test de requête simple
    const userCount = await prisma.user.count()
    console.log(`📊 Users in database: ${userCount}`)
    
    const disciplineCount = await prisma.discipline.count()
    console.log(`📚 Disciplines in database: ${disciplineCount}`)
    
    const workCount = await prisma.work.count()
    console.log(`📖 Works in database: ${workCount}`)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()





