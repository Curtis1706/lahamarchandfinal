#!/usr/bin/env node

/**
 * Script de configuration pour la production
 * Configure la base de données et crée les données initiales
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Configuration de la production...')

  try {
    // 1. Créer les disciplines de base
    console.log('📚 Création des disciplines...')
    const disciplines = [
      { name: 'Mathématiques', description: 'Sciences mathématiques' },
      { name: 'Français', description: 'Langue française et littérature' },
      { name: 'Sciences', description: 'Sciences naturelles et expérimentales' },
      { name: 'Histoire', description: 'Histoire et géographie' },
      { name: 'Anglais', description: 'Langue anglaise' },
      { name: 'Philosophie', description: 'Philosophie et éthique' },
      { name: 'Arts', description: 'Arts plastiques et visuels' }
    ]

    for (const discipline of disciplines) {
      await prisma.discipline.upsert({
        where: { name: discipline.name },
        update: {},
        create: discipline
      })
    }
    console.log('✅ Disciplines créées')

    // 2. Créer le compte PDG
    console.log('👑 Création du compte PDG...')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const pdg = await prisma.user.upsert({
      where: { email: 'pdg@lahamarchand.com' },
      update: {},
      create: {
        name: 'PDG Lahamarchand',
        email: 'pdg@lahamarchand.com',
        password: hashedPassword,
        role: 'PDG',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })
    console.log('✅ Compte PDG créé:', pdg.email)

    // 3. Créer des comptes de test
    console.log('👥 Création des comptes de test...')
    
    // Concepteur
    const concepteurPassword = await bcrypt.hash('concepteur123', 12)
    const concepteur = await prisma.user.upsert({
      where: { email: 'concepteur@test.com' },
      update: {},
      create: {
        name: 'Jean Concepteur',
        email: 'concepteur@test.com',
        password: concepteurPassword,
        role: 'CONCEPTEUR',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    // Auteur
    const auteurPassword = await bcrypt.hash('auteur123', 12)
    const auteur = await prisma.user.upsert({
      where: { email: 'auteur@test.com' },
      update: {},
      create: {
        name: 'Marie Auteur',
        email: 'auteur@test.com',
        password: auteurPassword,
        role: 'AUTEUR',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    // Représentant
    const representantPassword = await bcrypt.hash('representant123', 12)
    const representant = await prisma.user.upsert({
      where: { email: 'representant@test.com' },
      update: {},
      create: {
        name: 'Pierre Représentant',
        email: 'representant@test.com',
        password: representantPassword,
        role: 'REPRESENTANT',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    // Client
    const clientPassword = await bcrypt.hash('client123', 12)
    const client = await prisma.user.upsert({
      where: { email: 'client@test.com' },
      update: {},
      create: {
        name: 'Sophie Client',
        email: 'client@test.com',
        password: clientPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    })

    console.log('✅ Comptes de test créés')

    // 4. Lier le concepteur à une discipline
    const mathDiscipline = await prisma.discipline.findFirst({
      where: { name: 'Mathématiques' }
    })

    if (mathDiscipline) {
      await prisma.concepteur.upsert({
        where: { userId: concepteur.id },
        update: {},
        create: {
          userId: concepteur.id,
          disciplineId: mathDiscipline.id,
          status: 'ACTIVE'
        }
      })
      console.log('✅ Concepteur lié à la discipline Mathématiques')
    }

    console.log('\n🎉 Configuration de production terminée !')
    console.log('\n📋 Comptes créés :')
    console.log('👑 PDG: pdg@lahamarchand.com / admin123')
    console.log('👨‍💼 Concepteur: concepteur@test.com / concepteur123')
    console.log('👩‍💻 Auteur: auteur@test.com / auteur123')
    console.log('👨‍💼 Représentant: representant@test.com / representant123')
    console.log('👤 Client: client@test.com / client123')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
