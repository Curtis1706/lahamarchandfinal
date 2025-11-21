const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignDiscipline() {
  try {
    // ID de la discipline Français
    const disciplineId = 'cmh4sz9bm0000ulzsrpkqr9qv'
    
    const updatedAuthor = await prisma.user.update({
      where: { email: 'serge10@gmail.com' },
      data: { disciplineId: disciplineId },
      include: { discipline: true }
    })
    
    console.log('✅ Discipline assignée avec succès!')
    console.log(`   Auteur: ${updatedAuthor.name}`)
    console.log(`   Discipline: ${updatedAuthor.discipline?.name}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignDiscipline()

