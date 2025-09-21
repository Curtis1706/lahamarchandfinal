const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function migrateUserDiscipline() {
  try {
    console.log('🔄 Applying User-Discipline migration...')
    
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('migrate-user-discipline.sql', 'utf8')
    
    // Diviser en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
    
    console.log(`📝 Found ${queries.length} SQL queries to execute`)
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      if (query.trim()) {
        console.log(`🔄 Executing query ${i + 1}: ${query.substring(0, 50)}...`)
        try {
          await prisma.$executeRawUnsafe(query)
          console.log(`✅ Query ${i + 1} executed successfully`)
        } catch (error) {
          console.log(`⚠️ Query ${i + 1} failed (might already exist):`, error.message)
        }
      }
    }
    
    console.log('🎉 Migration completed!')
    
    // Vérifier la structure de la table User
    console.log('🔍 Checking User table structure...')
    const userTableInfo = await prisma.$queryRaw`
      PRAGMA table_info(User);
    `
    console.log('📋 User table columns:', userTableInfo)
    
  } catch (error) {
    console.error('❌ Migration error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUserDiscipline()


