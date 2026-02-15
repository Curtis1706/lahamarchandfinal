const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPDG() {
    try {
        const pdgUser = await prisma.user.findUnique({
            where: { email: 'pdg@lahamarchand.com' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true
            }
        })

        if (pdgUser) {
            console.log('✅ Compte PDG trouvé !')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('ID:', pdgUser.id)
            console.log('Nom:', pdgUser.name)
            console.log('Email:', pdgUser.email)
            console.log('Rôle:', pdgUser.role)
            console.log('Email vérifié:', pdgUser.emailVerified ? 'Oui' : 'Non')
            console.log('Créé le:', pdgUser.createdAt.toLocaleString('fr-FR'))
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('\n🔐 Identifiants de connexion:')
            console.log('   Email: pdg@lahamarchand.com')
            console.log('   Mot de passe: PDG2024!Secure')
            console.log('\n🌐 URL de connexion:')
            console.log('   http://localhost:3001/auth/signin')
        } else {
            console.log('❌ Compte PDG non trouvé')
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkPDG()
