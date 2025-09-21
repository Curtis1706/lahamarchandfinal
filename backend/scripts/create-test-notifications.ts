import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function createTestNotifications() {
  try {
    console.log("🔔 Creating test notifications...")

    // Trouver l'utilisateur client connecté
    const clientUser = await prisma.user.findFirst({
      where: { role: "CLIENT" }
    })

    if (!clientUser) {
      console.log("❌ No client user found")
      return
    }

    console.log(`✅ Found client user: ${clientUser.name} (${clientUser.email})`)

    // Créer quelques commandes récentes pour générer des notifications
    const recentOrders = await prisma.order.findMany({
      where: { 
        userId: clientUser.id,
        status: {
          not: "CANCELLED"
        }
      },
      include: {
        items: {
          include: {
            work: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    })

    console.log(`📦 Found ${recentOrders.length} recent orders`)

    // Créer des œuvres récentes pour les notifications de nouveautés
    const recentWorks = await prisma.work.findMany({
      where: {
        status: "ON_SALE",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // -7 jours
        }
      },
      include: {
        author: {
          select: { name: true }
        },
        discipline: true
      },
      orderBy: { createdAt: "desc" },
      take: 2
    })

    console.log(`📚 Found ${recentWorks.length} recent works`)

    // Simuler des mises à jour de statut pour créer des notifications
    if (recentOrders.length > 0) {
      const order = recentOrders[0]
      
      // Mettre à jour le statut pour créer une notification
      if (order.status === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "VALIDATED" }
        })
        console.log(`✅ Updated order ${order.id} to VALIDATED`)
      }
    }

    // Créer une commande récente pour tester les notifications
    const testWork = await prisma.work.findFirst({
      where: { status: "ON_SALE" }
    })

    if (testWork) {
      const newOrder = await prisma.order.create({
        data: {
          userId: clientUser.id,
          status: "PENDING",
          items: {
            create: {
              workId: testWork.id,
              quantity: 1,
              price: testWork.price
            }
          }
        }
      })
      console.log(`🛒 Created new test order: ${newOrder.id}`)
    }

    console.log("🎉 Test notifications setup completed!")
    console.log("🔔 The notification bell should now show:")
    console.log("   - New order notifications")
    console.log("   - Order status updates")
    console.log("   - New book notifications")
    console.log("   - System welcome message")

  } catch (error) {
    console.error("❌ Error creating test notifications:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestNotifications()



