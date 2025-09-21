const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection(databaseUrl, name) {
  console.log(`\n🔍 Test de connexion: ${name}`)
  console.log(`URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`) // Masquer le mot de passe
  
  process.env.DATABASE_URL = databaseUrl
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('✅ Connexion réussie')
    
    // Test simple
    const userCount = await prisma.user.count()
    console.log(`✅ ${userCount} utilisateurs trouvés`)
    
    return true
  } catch (error) {
    console.log('❌ Erreur:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function testAllConnections() {
  console.log('🧪 Test de toutes les connexions possibles...')
  
  // URLs à tester
  const connections = [
    {
      url: "postgresql://username:password@localhost:5432/lahamarchand_dev",
      name: "Local PostgreSQL"
    },
    {
      url: "file:./prisma/dev.db",
      name: "SQLite Local"
    }
  ]
  
  // Ajoutez votre vraie URL Neon ici
  // const neonUrl = "postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
  // connections.push({ url: neonUrl, name: "Neon Database" })
  
  for (const connection of connections) {
    const success = await testDatabaseConnection(connection.url, connection.name)
    if (success) {
      console.log(`\n🎉 ${connection.name} fonctionne!`)
      console.log('💡 Utilisez cette URL pour vos tests')
      break
    }
  }
}

testAllConnections()
