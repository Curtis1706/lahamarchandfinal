const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndCreateConcepteur() {
  try {
    console.log('🔍 Checking users in database...')
    
    // Vérifier tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log('📋 Found users:', users)
    
    // Chercher un concepteur
    const concepteur = users.find(u => u.role === 'CONCEPTEUR')
    
    if (concepteur) {
      console.log('✅ Concepteur found:', concepteur)
    } else {
      console.log('❌ No concepteur found, creating one...')
      
      // Créer un concepteur
      const newConcepteur = await prisma.user.create({
        data: {
          name: 'Concepteur Test',
          email: 'concepteur@test.com',
          role: 'CONCEPTEUR',
          emailVerified: new Date()
        }
      })
      
      console.log('✅ Concepteur created:', newConcepteur)
    }
    
    // Vérifier les projets
    const projects = await prisma.project.findMany({
      include: {
        discipline: true,
        concepteur: {
          select: { name: true, email: true }
        }
      }
    })
    
    console.log('📋 Found projects:', projects.length)
    projects.forEach(p => {
      console.log(`- ${p.title} (${p.status}) by ${p.concepteur.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndCreateConcepteur()


