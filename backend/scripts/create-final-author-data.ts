import { PrismaClient, Role, WorkStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createFinalAuthorData() {
  try {
    console.log('🚀 Creating final author test data...')

    // 1. Trouver l'auteur existant
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found')
      return
    }

    console.log('✅ Author found:', author.name)

    // 2. Supprimer toutes les données existantes pour recommencer proprement
    await prisma.royalty.deleteMany({ where: { userId: author.id } })
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    
    console.log('🧹 Cleaned existing data')

    // 3. Trouver les œuvres existantes
    const works = await prisma.work.findMany({
      where: { authorId: author.id },
      include: { discipline: true }
    })

    console.log(`✅ Found ${works.length} works`)

    // 4. Créer des clients
    const clients = await Promise.all([
      prisma.user.upsert({
        where: { email: 'client1@test.com' },
        update: {},
        create: {
          name: 'Fatou Sall',
          email: 'client1@test.com',
          password: await bcrypt.hash('password123', 10),
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
          password: await bcrypt.hash('password123', 10),
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
          password: await bcrypt.hash('password123', 10),
          role: Role.CLIENT,
          emailVerified: false
        }
      })
    ])

    console.log('✅ Clients ready')

    // 5. Créer des commandes réalistes
    const orders = []
    
    // Commande 1 - Algèbre Linéaire et Géométrie
    const order1 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Il y a 5 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        workId: works[0].id, // Algèbre Linéaire et Géométrie
        quantity: 3,
        price: works[0].price
      }
    })
    orders.push(order1)

    // Commande 2 - Mécanique Quantique Fondamentale
    const order2 = await prisma.order.create({
      data: {
        userId: clients[1].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Il y a 3 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        workId: works[1].id, // Mécanique Quantique Fondamentale
        quantity: 2,
        price: works[1].price
      }
    })
    orders.push(order2)

    // Commande 3 - Chimie Organique Moderne
    const order3 = await prisma.order.create({
      data: {
        userId: clients[2].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Il y a 2 jours
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        workId: works[2].id, // Chimie Organique Moderne
        quantity: 4,
        price: works[2].price
      }
    })
    orders.push(order3)

    // Commande 4 - Grammaire Française Approfondie
    const order4 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Il y a 1 jour
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        workId: works[3].id, // Grammaire Française Approfondie
        quantity: 2,
        price: works[3].price
      }
    })
    orders.push(order4)

    // Commande 5 - Commande récente pour les notifications
    const order5 = await prisma.order.create({
      data: {
        userId: clients[1].id,
        status: OrderStatus.COMPLETED,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // Il y a 2 heures
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order5.id,
        workId: works[0].id, // Algèbre Linéaire et Géométrie
        quantity: 1,
        price: works[0].price
      }
    })
    orders.push(order5)

    console.log(`✅ Created ${orders.length} orders`)

    // 6. Créer des royalties basées sur les ventes
    const royaltyRate = 0.15 // 15%

    for (const work of works) {
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

        // Créer des royalties avec différents statuts
        const royaltyAmount1 = Math.floor(totalRoyalty * 0.6) // 60% payé
        const royaltyAmount2 = totalRoyalty - royaltyAmount1 // 40% en attente

        // Premier paiement (payé)
        await prisma.royalty.create({
          data: {
            userId: author.id,
            workId: work.id,
            amount: royaltyAmount1,
            paid: true,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // Il y a 10 jours
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
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Il y a 5 jours
            }
          })
        }

        console.log(`✅ Royalties created for ${work.title}: ${totalRoyalty.toLocaleString()} FCFA (${totalSales} sales)`)
      }
    }

    console.log('\n🎉 Final author data creation completed!')
    console.log('📊 Summary:')
    console.log(`   - Author: ${author.name}`)
    console.log(`   - Works: ${works.length}`)
    console.log(`   - Orders: ${orders.length}`)
    console.log(`   - Clients: ${clients.length}`)

  } catch (error) {
    console.error('❌ Error creating final author data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createFinalAuthorData()


