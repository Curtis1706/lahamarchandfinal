const { PrismaClient } = require('@prisma/client')

async function testLocalDatabase() {
  console.log('🔧 Test des identifiants de base de données locale...')
  
  // Identifiants courants à tester
  const credentials = [
    { user: 'postgres', password: 'postgres', database: 'lahamarchand_dev' },
    { user: 'postgres', password: 'password', database: 'lahamarchand_dev' },
    { user: 'postgres', password: 'admin', database: 'lahamarchand_dev' },
    { user: 'postgres', password: '123456', database: 'lahamarchand_dev' },
    { user: 'postgres', password: '', database: 'lahamarchand_dev' },
    { user: 'postgres', password: 'postgres', database: 'postgres' },
    { user: 'postgres', password: 'password', database: 'postgres' },
  ]
  
  for (const cred of credentials) {
    const url = `postgresql://${cred.user}:${cred.password}@localhost:5432/${cred.database}`
    console.log(`\n🧪 Test: ${cred.user}@${cred.database}`)
    
    process.env.DATABASE_URL = url
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ Connexion réussie!')
      console.log('🔑 URL correcte:', url)
      
      // Test de création d'utilisateur
      const userCount = await prisma.user.count()
      console.log(`📊 ${userCount} utilisateurs dans la base`)
      
      await prisma.$disconnect()
      return url
    } catch (error) {
      console.log('❌ Échec:', error.message.split('\n')[0])
      await prisma.$disconnect()
    }
  }
  
  console.log('\n❌ Aucun identifiant ne fonctionne')
  console.log('💡 Vérifiez que PostgreSQL est démarré et que la base existe')
  return null
}

testLocalDatabase()
