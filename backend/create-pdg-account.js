const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')

async function createPDGAccount() {
  // Utiliser votre URL Neon
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_wIlBvmJV64xW@ep-late-credit-ad8o01yi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  const prisma = new PrismaClient()
  
  try {
    console.log('🏢 Création du compte PDG...')
    
    // Vérifier si un compte PDG existe déjà
    const existingPDG = await prisma.user.findFirst({
      where: { role: 'PDG' }
    })
    
    if (existingPDG) {
      console.log('⚠️ Un compte PDG existe déjà:')
      console.log('📧 Email:', existingPDG.email)
      console.log('👤 Nom:', existingPDG.name)
      console.log('🆔 ID:', existingPDG.id)
      console.log('')
      console.log('🔑 Mot de passe par défaut: PDG2024!Secure')
      console.log('🌐 URL de connexion: https://lahamarchand-gabon.vercel.app/login')
      console.log('📊 Dashboard: https://lahamarchand-gabon.vercel.app/dashboard/pdg')
      return
    }
    
    // Mot de passe sécurisé
    const password = 'PDG2024!Secure'
    const hashedPassword = await bcryptjs.hash(password, 12)
    
    // Créer le compte PDG
    const pdgUser = await prisma.user.create({
      data: {
        name: 'PDG Administrateur',
        email: 'pdg@lahamarchand.com',
        password: hashedPassword,
        role: 'PDG',
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Compte PDG créé avec succès!')
    console.log('📧 Email:', pdgUser.email)
    console.log('👤 Nom:', pdgUser.name)
    console.log('🔑 Mot de passe:', password)
    console.log('🆔 ID:', pdgUser.id)
    console.log('')
    console.log('🌐 Accès:')
    console.log('URL de connexion: https://lahamarchand-gabon.vercel.app/login')
    console.log('Dashboard: https://lahamarchand-gabon.vercel.app/dashboard/pdg')
    console.log('')
    console.log('⚠️ IMPORTANT: Changez le mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte PDG:', error)
    console.error('Code d\'erreur:', error.code)
    console.error('Message:', error.message)
    
    if (error.code === 'P2021') {
      console.log('\n💡 Solution: Table User n\'existe pas')
      console.log('Exécutez: npx prisma migrate deploy')
    } else if (error.code === 'P1001') {
      console.log('\n💡 Solution: Impossible de se connecter à la base de données')
      console.log('Vérifiez DATABASE_URL')
    }
  } finally {
    await prisma.$disconnect()
  }
}

createPDGAccount()
