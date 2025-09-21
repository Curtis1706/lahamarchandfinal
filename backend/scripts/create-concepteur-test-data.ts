import { PrismaClient, Role, WorkStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createConcepteurTestData() {
  try {
    console.log('🚀 Creating Concepteur test data...')

    // 1. Créer un concepteur de test
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const concepteur = await prisma.user.upsert({
      where: { email: 'concepteur@test.com' },
      update: {},
      create: {
        name: 'Marie Konaté',
        email: 'concepteur@test.com',
        password: hashedPassword,
        role: Role.CONCEPTEUR,
        emailVerified: false
      }
    })

    console.log('✅ Concepteur created:', concepteur.name)

    // 2. Trouver l'auteur existant pour l'associer aux œuvres
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found. Run create-author-test-data.ts first.')
      return
    }

    console.log('✅ Author found:', author.name)

    // 3. Trouver les disciplines existantes
    const disciplines = await prisma.discipline.findMany()
    console.log('✅ Disciplines found:', disciplines.length)

    // 4. Créer des œuvres réalistes pour le concepteur
    const works = [
      {
        title: 'Mathématiques Appliquées au Gabon',
        isbn: `978-2-${Date.now()}-01`,
        price: 18000,
        disciplineId: disciplines.find(d => d.name === 'Mathématiques')?.id,
        status: WorkStatus.ON_SALE,
        description: 'Manuel de mathématiques adapté au contexte gabonais'
      },
      {
        title: 'Histoire du Gabon Moderne',
        isbn: `978-2-${Date.now()}-02`,
        price: 22000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: WorkStatus.ON_SALE,
        description: 'Histoire contemporaine du Gabon de 1960 à nos jours'
      },
      {
        title: 'Contes et Légendes Gabonaises',
        isbn: `978-2-${Date.now()}-03`,
        price: 15000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: WorkStatus.ON_SALE,
        description: 'Collection de contes traditionnels gabonais'
      },
      {
        title: 'Physique Quantique pour Débutants',
        isbn: `978-2-${Date.now()}-04`,
        price: 25000,
        disciplineId: disciplines.find(d => d.name === 'Physique')?.id,
        status: WorkStatus.SUBMITTED,
        description: 'Introduction accessible à la physique quantique'
      },
      {
        title: 'Chimie Organique Avancée',
        isbn: `978-2-${Date.now()}-05`,
        price: 28000,
        disciplineId: disciplines.find(d => d.name === 'Chimie')?.id,
        status: WorkStatus.SUBMITTED,
        description: 'Cours approfondi de chimie organique'
      },
      {
        title: 'Géographie du Gabon',
        isbn: `978-2-${Date.now()}-06`,
        price: 16000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: WorkStatus.DRAFT,
        description: 'Géographie physique et humaine du Gabon'
      }
    ]

    const createdWorks = []
    for (const workData of works) {
      if (workData.disciplineId) {
        const work = await prisma.work.create({
          data: {
            ...workData,
            concepteurId: concepteur.id,
            authorId: author.id
          }
        })
        createdWorks.push(work)
        console.log(`✅ Work created: ${work.title} (${work.status})`)
      }
    }

    // 5. Créer des clients pour les commandes
    const clients = await Promise.all([
      prisma.user.upsert({
        where: { email: 'client1@test.com' },
        update: {},
        create: {
          name: 'Fatou Sall',
          email: 'client1@test.com',
          password: hashedPassword,
          role: Role.CLIENT,
          emailVerified: false
        }
      }),
      prisma.user.upsert({
        where: { email: 'client2@test.com' },
        update: {},
        create: {
          name: 'Moussa Traoré',
          email: 'client2@test.com',
          password: hashedPassword,
          role: Role.CLIENT,
          emailVerified: false
        }
      }),
      prisma.user.upsert({
        where: { email: 'client3@test.com' },
        update: {},
        create: {
          name: 'Aïcha Diop',
          email: 'client3@test.com',
          password: hashedPassword,
          role: Role.CLIENT,
          emailVerified: false
        }
      })
    ])

    console.log('✅ Clients ready')

    // 6. Créer des commandes pour les œuvres du concepteur
    const orders = []
    
    // Commande 1 - Mathématiques Appliquées au Gabon
    const order1 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // Il y a 10 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        workId: createdWorks[0].id, // Mathématiques Appliquées au Gabon
        quantity: 2,
        price: createdWorks[0].price
      }
    })
    orders.push(order1)

    // Commande 2 - Histoire du Gabon Moderne
    const order2 = await prisma.order.create({
      data: {
        userId: clients[1].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Il y a 7 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        workId: createdWorks[1].id, // Histoire du Gabon Moderne
        quantity: 3,
        price: createdWorks[1].price
      }
    })
    orders.push(order2)

    // Commande 3 - Contes et Légendes Gabonaises
    const order3 = await prisma.order.create({
      data: {
        userId: clients[2].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Il y a 5 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        workId: createdWorks[2].id, // Contes et Légendes Gabonaises
        quantity: 1,
        price: createdWorks[2].price
      }
    })
    orders.push(order3)

    // Commande 4 - Commande récente
    const order4 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Il y a 1 jour
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        workId: createdWorks[0].id, // Mathématiques Appliquées au Gabon
        quantity: 1,
        price: createdWorks[0].price
      }
    })
    orders.push(order4)

    console.log(`✅ Created ${orders.length} orders`)

    // 7. Créer des royalties pour l'auteur basées sur les ventes
    const royaltyRate = 0.15 // 15%

    for (const work of createdWorks) {
      const orderItems = await prisma.orderItem.findMany({
        where: { workId: work.id },
        include: { order: true }
      })

      const totalSales = orderItems.reduce((sum, item) => {
        return sum + (item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)

      if (totalSales > 0) {
        const totalRevenue = orderItems.reduce((sum, item) => {
          return sum + (item.order.status !== 'CANCELLED' ? (item.price * item.quantity) : 0)
        }, 0)

        const totalRoyalty = totalRevenue * royaltyRate

        // Créer des royalties avec différents statuts
        const royaltyAmount1 = Math.floor(totalRoyalty * 0.7) // 70% payé
        const royaltyAmount2 = totalRoyalty - royaltyAmount1 // 30% en attente

        // Premier paiement (payé)
        await prisma.royalty.create({
          data: {
            userId: author.id,
            workId: work.id,
            amount: royaltyAmount1,
            paid: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // Il y a 15 jours
          }
        })

        // Deuxième paiement (en attente)
        if (royaltyAmount2 > 0) {
          await prisma.royalty.create({
            data: {
              userId: author.id,
              workId: work.id,
              amount: royaltyAmount2,
              paid: false,
              createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // Il y a 8 jours
            }
          })
        }

        console.log(`✅ Royalties created for ${work.title}: ${totalRoyalty.toLocaleString()} FCFA (${totalSales} sales)`)
      }
    }

    console.log('\n🎉 Concepteur test data creation completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Concepteur: ${concepteur.name} (${concepteur.email})`)
    console.log(`   - Works: ${createdWorks.length}`)
    console.log(`   - Orders: ${orders.length}`)
    console.log(`   - Clients: ${clients.length}`)
    console.log(`   - Disciplines: ${disciplines.length}`)

  } catch (error) {
    console.error('❌ Error creating concepteur test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createConcepteurTestData()


