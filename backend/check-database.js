// Script simple pour vérifier et configurer la base de données
const { exec } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndSetupDatabase() {
  try {
    console.log('🔍 Checking database status...')

    // 1. Vérifier si Prisma est configuré
    try {
      await prisma.$connect()
      console.log('✅ Database connection successful')
    } catch (error) {
      console.log('❌ Database connection failed:', error.message)
      console.log('💡 Please run: npx prisma generate')
      return
    }

    // 2. Vérifier si les tables existent
    try {
      await prisma.user.findFirst()
      console.log('✅ User table exists')
    } catch (error) {
      console.log('⚠️ User table not found, applying migrations...')
      await applyMigrations()
      return
    }

    try {
      await prisma.project.findFirst()
      console.log('✅ Project table exists')
    } catch (error) {
      console.log('⚠️ Project table not found, applying migrations...')
      await applyMigrations()
      return
    }

    try {
      await prisma.work.findFirst()
      console.log('✅ Work table exists')
    } catch (error) {
      console.log('⚠️ Work table not found, applying migrations...')
      await applyMigrations()
      return
    }

    // 3. Vérifier si les données de base existent
    const userCount = await prisma.user.count()
    const disciplineCount = await prisma.discipline.count()
    
    console.log(`📊 Database status:`)
    console.log(`   - Users: ${userCount}`)
    console.log(`   - Disciplines: ${disciplineCount}`)

    if (userCount === 0 || disciplineCount === 0) {
      console.log('⚠️ Missing basic data, creating...')
      await createBasicData()
    } else {
      console.log('✅ Database is ready!')
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function applyMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Applying Prisma migrations...')
    exec('npx prisma migrate dev --name add-project-model', (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️ Migration failed, trying reset...')
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
        console.log('✅ Migrations applied successfully')
        resolve()
      }
    })
  })
}

async function createBasicData() {
  try {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Créer les disciplines
    const disciplines = [
      'Mathématiques', 'Français', 'Physique', 'Chimie', 'Histoire',
      'Géographie', 'Biologie', 'Philosophie', 'Littérature', 'Sciences'
    ]

    for (const disciplineName of disciplines) {
      await prisma.discipline.upsert({
        where: { name: disciplineName },
        update: {},
        create: { name: disciplineName }
      })
      console.log(`   ✅ ${disciplineName}`)
    }

    // Créer les utilisateurs
    const users = [
      { name: 'Jean Auteur', email: 'auteur@test.com', role: 'AUTEUR' },
      { name: 'Marie Konaté', email: 'concepteur@test.com', role: 'CONCEPTEUR' },
      { name: 'Directeur Général', email: 'pdg@test.com', role: 'PDG' }
    ]

    for (const userData of users) {
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
    }

    console.log('✅ Basic data created successfully')
  } catch (error) {
    console.log('❌ Error creating basic data:', error.message)
  }
}

checkAndSetupDatabase()


