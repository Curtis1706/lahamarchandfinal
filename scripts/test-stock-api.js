const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testStockAPI() {
  console.log('🧪 Test de l\'API Stock...')

  try {
    // Test 1: Récupérer les œuvres
    console.log('\n1. Test récupération des œuvres...')
    const works = await prisma.work.findMany({
      select: {
        id: true,
        title: true,
        isbn: true,
        price: true,
        stock: true,
        minStock: true,
        maxStock: true,
        status: true,
        publicationDate: true,
        version: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      where: {
        status: 'PUBLISHED'
      },
      orderBy: {
        title: 'asc'
      }
    })

    console.log(`✅ ${works.length} œuvre(s) trouvée(s)`)
    if (works.length > 0) {
      console.log('   - Première œuvre:', works[0].title)
    }

    // Test 2: Récupérer les mouvements de stock
    console.log('\n2. Test récupération des mouvements...')
    const movements = await prisma.stockMovement.findMany({
      select: {
        id: true,
        workId: true,
        work: {
          select: {
            title: true,
            isbn: true
          }
        },
        type: true,
        quantity: true,
        reason: true,
        reference: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`✅ ${movements.length} mouvement(s) trouvé(s)`)
    if (movements.length > 0) {
      console.log('   - Premier mouvement:', movements[0].type, movements[0].quantity)
    }

    // Test 3: Calculer les statistiques
    console.log('\n3. Test calcul des statistiques...')
    const totalWorks = await prisma.work.count({
      where: { status: 'PUBLISHED' }
    })

    const lowStockWorks = await prisma.work.count({
      where: {
        status: 'PUBLISHED',
        stock: {
          lte: prisma.work.fields.minStock
        }
      }
    })

    const outOfStockWorks = await prisma.work.count({
      where: {
        status: 'PUBLISHED',
        stock: 0
      }
    })

    console.log('✅ Statistiques calculées:')
    console.log(`   - Total œuvres: ${totalWorks}`)
    console.log(`   - Stock faible: ${lowStockWorks}`)
    console.log(`   - Rupture: ${outOfStockWorks}`)

    console.log('\n🎉 Tous les tests sont passés!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    throw error
  }
}

testStockAPI()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
