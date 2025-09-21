import { PrismaClient, OrderStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function createOrdersForCurrentUser() {
  console.log("🛒 Creating orders for current user...")

  try {
    // Trouver l'utilisateur client (celui avec l'email client@lahamarchand.com)
    const user = await prisma.user.findFirst({
      where: { 
        role: "CLIENT"
      }
    })

    if (!user) {
      console.log("❌ No client user found")
      return
    }

    console.log(`📧 Found client: ${user.name} (${user.email})`)

    // Récupérer quelques livres
    const books = await prisma.work.findMany({
      where: { status: "ON_SALE" },
      take: 6
    })

    if (books.length === 0) {
      console.log("❌ No books found")
      return
    }

    console.log(`📚 Found ${books.length} books`)

    // Supprimer les anciennes commandes de ce client
    await prisma.order.deleteMany({
      where: { userId: user.id }
    })

    console.log("🗑️ Cleared existing orders")

    // Créer des commandes avec différents statuts et dates
    const ordersData = [
      {
        status: OrderStatus.DELIVERED,
        createdAt: new Date("2024-01-15"),
        items: [
          { workId: books[0].id, quantity: 2, price: books[0].price },
          { workId: books[1].id, quantity: 1, price: books[1].price },
        ]
      },
      {
        status: OrderStatus.DELIVERED,
        createdAt: new Date("2024-02-20"),
        items: [
          { workId: books[2].id, quantity: 1, price: books[2].price },
        ]
      },
      {
        status: OrderStatus.VALIDATED,
        createdAt: new Date("2024-03-10"),
        items: [
          { workId: books[3].id, quantity: 1, price: books[3].price },
          { workId: books[4].id, quantity: 2, price: books[4].price },
        ]
      },
      {
        status: OrderStatus.PENDING,
        createdAt: new Date("2024-03-25"),
        items: [
          { workId: books[5].id, quantity: 1, price: books[5].price },
        ]
      },
    ]

    // Créer les nouvelles commandes
    for (const orderData of ordersData) {
      await prisma.order.create({
        data: {
          userId: user.id,
          status: orderData.status,
          createdAt: orderData.createdAt,
          items: {
            create: orderData.items
          }
        }
      })
    }

    console.log(`✅ Created ${ordersData.length} orders for ${user.name}`)
    
    // Afficher un résumé
    const totalOrders = await prisma.order.count({ where: { userId: user.id } })
    const totalAmount = await prisma.orderItem.aggregate({
      where: { order: { userId: user.id } },
      _sum: { price: true }
    })
    
    console.log(`📊 Summary: ${totalOrders} orders, ${totalAmount._sum.price} FCFA total`)

  } catch (error) {
    console.error("❌ Error creating orders:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createOrdersForCurrentUser()
}

export { createOrdersForCurrentUser }



