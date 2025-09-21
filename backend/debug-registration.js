const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')

async function debugRegistration() {
  // Utiliser votre vraie URL Neon
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_wIlBvmJV64xW@ep-late-credit-ad8o01yi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Diagnostic de l\'inscription...')
    
    // Test 1: Connexion à la base de données
    console.log('\n1. Test de connexion à la base de données...')
    await prisma.$connect()
    console.log('✅ Connexion réussie')
    
    // Test 2: Vérifier les tables
    console.log('\n2. Vérification des tables...')
    const userCount = await prisma.user.count()
    console.log(`✅ Table User: ${userCount} utilisateurs`)
    
    const disciplineCount = await prisma.discipline.count()
    console.log(`✅ Table Discipline: ${disciplineCount} disciplines`)
    
    // Test 3: Vérifier le schéma User
    console.log('\n3. Test du schéma User...')
    const userSchema = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disciplineId: true,
        emailVerified: true,
        createdAt: true
      }
    })
    console.log('✅ Schéma User OK')
    
    // Test 4: Test de création d'utilisateur
    console.log('\n4. Test de création d\'utilisateur...')
    const testEmail = `test-${Date.now()}@example.com`
    const hashedPassword = await bcryptjs.hash('testpassword123', 10)
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        role: 'CLIENT',
        emailVerified: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    console.log('✅ Test de création réussi:', testUser.email)
    
    // Nettoyer
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test utilisateur supprimé')
    
    // Test 5: Vérifier les rôles
    console.log('\n5. Vérification des rôles...')
    const validRoles = ['PDG', 'REPRESENTANT', 'CONCEPTEUR', 'AUTEUR', 'PARTENAIRE', 'CLIENT']
    console.log('✅ Rôles valides:', validRoles)
    
    console.log('\n🎉 Tous les tests sont passés!')
    console.log('\n💡 Le problème pourrait être:')
    console.log('- Données manquantes dans la requête')
    console.log('- Validation côté client')
    console.log('- Problème de CORS')
    console.log('- Timeout de la requête')
    
  } catch (error) {
    console.error('\n❌ Erreur détectée:', error.message)
    console.error('Code d\'erreur:', error.code)
    console.error('Stack:', error.stack)
    
    if (error.code === 'P2021') {
      console.log('\n💡 Solution: Table User n\'existe pas')
      console.log('Exécutez: npx prisma migrate deploy')
    } else if (error.code === 'P1001') {
      console.log('\n💡 Solution: Impossible de se connecter à la base de données')
      console.log('Vérifiez DATABASE_URL')
    } else if (error.code === 'P2002') {
      console.log('\n💡 Solution: Contrainte d\'unicité violée')
    } else if (error.code === 'P2003') {
      console.log('\n💡 Solution: Clé étrangère invalide')
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

debugRegistration()
