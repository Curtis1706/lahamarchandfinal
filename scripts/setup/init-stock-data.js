const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Initialisation des données de stock...')

  try {
    // Créer une discipline de test
    const discipline = await prisma.discipline.upsert({
      where: { name: 'Mathématiques' },
      update: {},
      create: {
        name: 'Mathématiques',
        description: 'Discipline des mathématiques',
        isActive: true
      }
    })

    console.log('✅ Discipline créée:', discipline.name)

    // Créer un utilisateur auteur de test
    const author = await prisma.user.upsert({
      where: { email: 'auteur@test.com' },
      update: {},
      create: {
        name: 'Auteur Test',
        email: 'auteur@test.com',
        password: '$2a$10$example', // Mot de passe hashé
        role: 'AUTEUR',
        status: 'ACTIVE',
        disciplineId: discipline.id
      }
    })

    console.log('✅ Auteur créé:', author.name)

    // Créer une œuvre de test
    const work = await prisma.work.upsert({
      where: { isbn: '978-1234567890' },
      update: {},
      create: {
        title: 'Manuel de Mathématiques CE1',
        description: 'Manuel de mathématiques pour le CE1',
        isbn: '978-1234567890',
        price: 15.50,
        stock: 100,
        minStock: 10,
        maxStock: 200,
        status: 'PUBLISHED',
        publicationDate: new Date(),
        version: '1.0',
        disciplineId: discipline.id,
        authorId: author.id
      }
    })

    console.log('✅ Œuvre créée:', work.title)

    // Créer un mouvement de stock de test
    const stockMovement = await prisma.stockMovement.create({
      data: {
        workId: work.id,
        type: 'INBOUND',
        quantity: 100,
        reason: 'Stock initial',
        reference: 'INIT-001'
      }
    })

    console.log('✅ Mouvement de stock créé:', stockMovement.id)

    console.log('🎉 Initialisation terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
