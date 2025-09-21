import { PrismaClient, Role, WorkStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAuthorTestData() {
  try {
    console.log('🚀 Creating comprehensive author test data...')

    // 1. Créer un auteur de test
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const author = await prisma.user.upsert({
      where: { email: 'auteur@test.com' },
      update: {},
      create: {
        name: 'Dr. Amadou Diallo',
        email: 'auteur@test.com',
        password: hashedPassword,
        role: Role.AUTEUR,
        emailVerified: false
      }
    })

    console.log('✅ Author created:', author.name)

    // 2. Créer des disciplines si elles n'existent pas
    const disciplines = await Promise.all([
      prisma.discipline.upsert({
        where: { name: 'Mathématiques' },
        update: {},
        create: { name: 'Mathématiques' }
      }),
      prisma.discipline.upsert({
        where: { name: 'Physique' },
        update: {},
        create: { name: 'Physique' }
      }),
      prisma.discipline.upsert({
        where: { name: 'Chimie' },
        update: {},
        create: { name: 'Chimie' }
      }),
      prisma.discipline.upsert({
        where: { name: 'Français' },
        update: {},
        create: { name: 'Français' }
      })
    ])

    console.log('✅ Disciplines created:', disciplines.length)

    // 3. Créer un concepteur pour les œuvres
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

    // 4. Créer des œuvres réalistes pour l'auteur
    const works = [
      {
        title: 'Algèbre Linéaire et Géométrie',
        isbn: `978-2-123456-78-${Date.now()}`,
        price: 15000,
        disciplineId: disciplines[0].id,
        status: WorkStatus.ON_SALE
      },
      {
        title: 'Mécanique Quantique Fondamentale',
        isbn: `978-2-123456-79-${Date.now() + 1}`,
        price: 25000,
        disciplineId: disciplines[1].id,
        status: WorkStatus.ON_SALE
      },
      {
        title: 'Chimie Organique Moderne',
        isbn: `978-2-123456-80-${Date.now() + 2}`,
        price: 20000,
        disciplineId: disciplines[2].id,
        status: WorkStatus.ON_SALE
      },
      {
        title: 'Grammaire Française Approfondie',
        isbn: `978-2-123456-81-${Date.now() + 3}`,
        price: 12000,
        disciplineId: disciplines[3].id,
        status: WorkStatus.ON_SALE
      },
      {
        title: 'Analyse Mathématique Avancée',
        isbn: `978-2-123456-82-${Date.now() + 4}`,
        price: 18000,
        disciplineId: disciplines[0].id,
        status: WorkStatus.SUBMITTED
      }
    ]

    const createdWorks = []
    for (const workData of works) {
      const work = await prisma.work.create({
        data: {
          ...workData,
          authorId: author.id,
          concepteurId: concepteur.id
        }
      })
      createdWorks.push(work)
      console.log(`✅ Work created: ${work.title}`)
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

    console.log('✅ Clients created:', clients.length)

    // 6. Créer des commandes réalistes avec différents statuts
    const orders = []
    const orderData = [
      { userId: clients[0].id, status: OrderStatus.COMPLETED, items: [
        { workId: createdWorks[0].id, quantity: 2, price: createdWorks[0].price },
        { workId: createdWorks[1].id, quantity: 1, price: createdWorks[1].price }
      ]},
      { userId: clients[1].id, status: OrderStatus.COMPLETED, items: [
        { workId: createdWorks[0].id, quantity: 1, price: createdWorks[0].price },
        { workId: createdWorks[2].id, quantity: 3, price: createdWorks[2].price }
      ]},
      { userId: clients[2].id, status: OrderStatus.COMPLETED, items: [
        { workId: createdWorks[1].id, quantity: 2, price: createdWorks[1].price },
        { workId: createdWorks[3].id, quantity: 1, price: createdWorks[3].price }
      ]},
      { userId: clients[0].id, status: OrderStatus.COMPLETED, items: [
        { workId: createdWorks[2].id, quantity: 1, price: createdWorks[2].price }
      ]},
      { userId: clients[1].id, status: OrderStatus.COMPLETED, items: [
        { workId: createdWorks[0].id, quantity: 1, price: createdWorks[0].price },
        { workId: createdWorks[3].id, quantity: 2, price: createdWorks[3].price }
      ]}
    ]

    for (let i = 0; i < orderData.length; i++) {
      const totalAmount = orderData[i].items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      const order = await prisma.order.create({
        data: {
          userId: orderData[i].userId,
          status: orderData[i].status,
          createdAt: new Date(Date.now() - (i * 7 + Math.random() * 3) * 24 * 60 * 60 * 1000) // Dates échelonnées
        }
      })

      // Créer les items de commande
      for (const itemData of orderData[i].items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            workId: itemData.workId,
            quantity: itemData.quantity,
            price: itemData.price
          }
        })
      }

      orders.push(order)
      console.log(`✅ Order created: ${order.id} - ${totalAmount} FCFA`)
    }

    // 7. Créer des royalties réalistes basées sur les ventes
    const royaltyRate = 0.15 // 15% de royalty

    for (const work of createdWorks) {
      // Calculer les ventes totales pour cette œuvre
      const orderItems = await prisma.orderItem.findMany({
        where: { workId: work.id },
        include: { order: true }
      })

      const totalSales = orderItems.reduce((sum, item) => {
        return sum + (item.order.status !== OrderStatus.CANCELLED ? item.quantity : 0)
      }, 0)

      if (totalSales > 0) {
        const totalRevenue = orderItems.reduce((sum, item) => {
          return sum + (item.order.status !== OrderStatus.CANCELLED ? (item.price * item.quantity) : 0)
        }, 0)

        const totalRoyalty = totalRevenue * royaltyRate

        // Créer des royalties avec différents statuts de paiement
        const royaltyAmount = Math.floor(totalRoyalty / 2) // Diviser en 2 paiements
        const remainingAmount = totalRoyalty - royaltyAmount

        // Premier paiement (payé)
        await prisma.royalty.create({
          data: {
            userId: author.id,
            workId: work.id,
            amount: royaltyAmount,
            paid: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Il y a 30 jours
          }
        })

        // Deuxième paiement (en attente)
        if (remainingAmount > 0) {
          await prisma.royalty.create({
            data: {
              userId: author.id,
              workId: work.id,
              amount: remainingAmount,
              paid: false,
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // Il y a 15 jours
            }
          })
        }

        console.log(`✅ Royalties created for ${work.title}: ${totalRoyalty} FCFA (${totalSales} sales)`)
      }
    }

    // 8. Créer quelques commandes récentes pour les notifications
    const recentOrder = await prisma.order.create({
      data: {
        userId: clients[2].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Il y a 2 jours
      }
    })

    await prisma.orderItem.create({
      data: {
        orderId: recentOrder.id,
        workId: createdWorks[0].id,
        quantity: 2,
        price: createdWorks[0].price
      }
    })

    console.log('✅ Recent order created for notifications')

    console.log('\n🎉 Author test data creation completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Author: ${author.name} (${author.email})`)
    console.log(`   - Works: ${createdWorks.length}`)
    console.log(`   - Orders: ${orders.length}`)
    console.log(`   - Clients: ${clients.length}`)
    console.log(`   - Disciplines: ${disciplines.length}`)

  } catch (error) {
    console.error('❌ Error creating author test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAuthorTestData()
