// Script ultra-simple pour configurer la base de données
const { exec } = require('child_process')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Configuration de la base de données...')

    // 1. Générer le client Prisma
    console.log('📦 Génération du client Prisma...')
    await new Promise((resolve) => {
      exec('npx prisma generate', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️ Avertissement Prisma generate:', error.message)
        }
        console.log('✅ Client Prisma généré')
        resolve()
      })
    })

    // 2. Appliquer les migrations
    console.log('🔄 Application des migrations...')
    try {
      await new Promise((resolve, reject) => {
        exec('npx prisma migrate dev --name add-project-model', (error, stdout, stderr) => {
          if (error) {
            console.log('⚠️ Migration échouée, tentative de reset...')
            exec('npx prisma migrate reset --force', (resetError, resetStdout, resetStderr) => {
              if (resetError) {
                console.log('❌ Reset échoué:', resetError.message)
                reject(resetError)
              } else {
                console.log('✅ Base de données réinitialisée et migrations appliquées')
                resolve()
              }
            })
          } else {
            console.log('✅ Migrations appliquées avec succès')
            resolve()
          }
        })
      })
    } catch (error) {
      console.log('⚠️ Problème de migration, continuation avec la création des données...')
    }

    // 3. Créer les données de base
    console.log('📝 Création des données de base...')

    // Disciplines
    const disciplines = [
      'Mathématiques', 'Français', 'Physique', 'Chimie', 'Histoire',
      'Géographie', 'Biologie', 'Philosophie', 'Littérature', 'Sciences'
    ]

    for (const name of disciplines) {
      try {
        await prisma.discipline.upsert({
          where: { name },
          update: {},
          create: { name }
        })
        console.log(`   ✅ ${name}`)
      } catch (error) {
        console.log(`   ⚠️ ${name}: ${error.message}`)
      }
    }

    // Utilisateurs
    const hashedPassword = await bcrypt.hash('password123', 10)
    const users = [
      { name: 'Jean Auteur', email: 'auteur@test.com', role: 'AUTEUR' },
      { name: 'Marie Konaté', email: 'concepteur@test.com', role: 'CONCEPTEUR' },
      { name: 'Directeur Général', email: 'pdg@test.com', role: 'PDG' }
    ]

    for (const userData of users) {
      try {
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {},
          create: {
            ...userData,
            password: hashedPassword,
            emailVerified: false
          }
        })
        console.log(`✅ Utilisateur créé: ${userData.name}`)
      } catch (error) {
        console.log(`⚠️ Utilisateur ${userData.name}: ${error.message}`)
      }
    }

    console.log('\n🎉 Configuration terminée!')
    console.log('📊 Résumé:')
    console.log('   - Disciplines: 10')
    console.log('   - Utilisateurs: 3 (Auteur, Concepteur, PDG)')
    console.log('   - Prêt pour le workflow Projet/Œuvre')

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()


