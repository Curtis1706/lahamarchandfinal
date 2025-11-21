const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetPdgPassword() {
  try {
    console.log('🔐 Réinitialisation du mot de passe PDG...')
    console.log('📧 Email: pdg@lahamarchand.com')
    
    // Vérifier si l'utilisateur existe
    const pdgUser = await prisma.user.findUnique({
      where: { email: 'pdg@lahamarchand.com' }
    })
    
    if (!pdgUser) {
      console.log('❌ Utilisateur PDG non trouvé!')
      console.log('💡 Création du compte PDG...')
      
      // Créer le compte PDG s'il n'existe pas
      const newPassword = 'PDG2024!Secure'
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      
      const newPdg = await prisma.user.create({
        data: {
          name: 'PDG Administrateur',
          email: 'pdg@lahamarchand.com',
          password: hashedPassword,
          role: 'PDG',
          emailVerified: new Date(),
        }
      })
      
      console.log('✅ Compte PDG créé avec succès!')
      console.log('📧 Email:', newPdg.email)
      console.log('🔑 Mot de passe:', newPassword)
      console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!')
      return
    }
    
    // Générer un nouveau mot de passe sécurisé
    const newPassword = 'PDG2024!Secure'
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email: 'pdg@lahamarchand.com' },
      data: { password: hashedPassword }
    })
    
    console.log('✅ Mot de passe réinitialisé avec succès!')
    console.log('📧 Email: pdg@lahamarchand.com')
    console.log('🔑 Nouveau mot de passe:', newPassword)
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetPdgPassword()

