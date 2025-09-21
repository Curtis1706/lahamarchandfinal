import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser(request)
    console.log("User in dashboard API:", user)
    
    if (!user) {
      console.log("No user found in dashboard API")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Récupérer les statistiques du client
    const [orders, totalSpent, favoriteCategories] = await Promise.all([
      // Commandes du client
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),

      // Montant total dépensé
      prisma.orderItem.aggregate({
        where: {
          order: { userId }
        },
        _sum: {
          price: true
        }
      }),

      // Disciplines préférées (basées sur les achats)
      prisma.orderItem.groupBy({
        by: ['workId'],
        where: {
          order: { userId }
        },
        _sum: {
          quantity: true
        }
      })
    ])

    // Calculer les statistiques
    const totalOrders = orders.length
    const pendingOrders = orders.filter(order => order.status === "PENDING").length
    const deliveredOrders = orders.filter(order => order.status === "DELIVERED").length
    const totalAmount = totalSpent._sum.price || 0

    // Calculer les livres achetés
    const totalBooks = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Commandes récentes (5 dernières)
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      date: order.createdAt,
      status: order.status,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        title: item.work.title,
        quantity: item.quantity,
        price: item.price
      }))
    }))

    // Statistiques par mois (6 derniers mois)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyStats = await prisma.order.findMany({
      where: {
        userId,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      include: {
        items: true
      }
    })

    // Grouper par mois
    const monthlyData = monthlyStats.reduce((acc, order) => {
      const month = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { orders: 0, amount: 0 }
      }
      acc[month].orders += 1
      acc[month].amount += order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      return acc
    }, {} as Record<string, { orders: number; amount: number }>)

    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalBooks,
        totalAmount,
      },
      recentOrders,
      monthlyData,
      user: {
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error("Error fetching client dashboard:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
