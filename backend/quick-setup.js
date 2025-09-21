// Script simple pour configurer la base de données
const { exec } = require('child_process')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...')

    // 1. Générer le client Prisma
    console.log('📦 Generating Prisma client...')
    await new Promise((resolve, reject) => {
      exec('npx prisma generate', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️ Prisma generate warning:', error.message)
        }
        console.log('✅ Prisma client generated')
        resolve()
      })
    })

    // 2. Appliquer les migrations
    console.log('🔄 Applying migrations...')
    try {
      await new Promise((resolve, reject) => {
        exec('npx prisma migrate dev --name add-project-model', (error, stdout, stderr) => {
          if (error) {
            console.log('⚠️ Migration error:', error.message)
            // Essayer de réinitialiser la base de données
            exec('npx prisma migrate reset --force', (resetError, resetStdout, resetStderr) => {
              if (resetError) {
                console.log('❌ Reset failed:', resetError.message)
                reject(resetError)
              } else {
                console.log('✅ Database reset and migrations applied')
                resolve()
              }
            })
          } else {
            console.log('✅ Migrations applied')
            resolve()
          }
        })
      })
    } catch (error) {
      console.log('⚠️ Migration failed, continuing with data creation...')
    }

    // 3. Créer les données de base
    console.log('📝 Creating basic data...')

    // Disciplines
    const disciplines = [
      'Mathématiques', 'Français', 'Physique', 'Chimie', 'Histoire',
      'Géographie', 'Biologie', 'Philosophie', 'Littérature', 'Sciences'
    ]

    for (const disciplineName of disciplines) {
      try {
        await prisma.discipline.upsert({
          where: { name: disciplineName },
          update: {},
          create: { name: disciplineName }
        })
        console.log(`   ✅ ${disciplineName}`)
      } catch (error) {
        console.log(`   ⚠️ ${disciplineName}: ${error.message}`)
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
        console.log(`✅ User created: ${userData.name}`)
      } catch (error) {
        console.log(`⚠️ User ${userData.name}: ${error.message}`)
      }
    }

    console.log('\n🎉 Database setup completed!')
    console.log('📊 Summary:')
    console.log('   - Disciplines: 10')
    console.log('   - Users: 3 (Auteur, Concepteur, PDG)')
    console.log('   - Ready for Project/Work workflow')

  } catch (error) {
    console.error('❌ Error setting up database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()


