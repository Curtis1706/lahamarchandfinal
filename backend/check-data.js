// Script pour vérifier les données existantes
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking existing data...')

    // Vérifier les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    console.log('👥 Users found:', users.length)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
    })

    // Vérifier les disciplines
    const disciplines = await prisma.discipline.findMany({
      select: {
        id: true,
        name: true
      }
    })
    console.log('📚 Disciplines found:', disciplines.length)
    disciplines.forEach(discipline => {
      console.log(`   - ${discipline.name} (${discipline.id})`)
    })

    // Vérifier les œuvres existantes
    const works = await prisma.work.findMany({
      select: {
        id: true,
        title: true,
        concepteurId: true,
        status: true
      }
    })
    console.log('📖 Works found:', works.length)
    works.forEach(work => {
      console.log(`   - ${work.title} (${work.status})`)
    })

    // Vérifier spécifiquement le concepteur
    const concepteur = await prisma.user.findUnique({
      where: { email: 'concepteur@test.com' }
    })
    
    if (concepteur) {
      console.log('✅ Concepteur found:', concepteur.name)
    } else {
      console.log('❌ Concepteur not found!')
    }

  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()


