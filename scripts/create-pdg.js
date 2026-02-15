const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createPDG() {
    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: 'pdg@lahamarchand.com' }
        })

        if (existingUser) {
            console.log('❌ Un utilisateur avec cet email existe déjà')
            console.log('Email:', existingUser.email)
            console.log('Rôle:', existingUser.role)
            return
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash('PDG2024!Secure', 10)

        // Créer l'utilisateur PDG
        const user = await prisma.user.create({
            data: {
                email: 'pdg@lahamarchand.com',
                password: hashedPassword,
                name: 'PDG La Hamarchand',
                role: 'PDG',
                emailVerified: new Date()
            }
        })

        console.log('✅ Compte PDG créé avec succès!')
        console.log('Email:', user.email)
        console.log('Nom:', user.name)
        console.log('Rôle:', user.role)
        console.log('\n📧 Identifiants de connexion:')
        console.log('Email: pdg@lahamarchand.com')
        console.log('Mot de passe: PDG2024!Secure')

    } catch (error) {
        console.error('❌ Erreur lors de la création du compte:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

createPDG()
