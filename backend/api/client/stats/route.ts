import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Récupérer toutes les données nécessaires
    const [orders, allOrderItems] = await Promise.all([
      // Toutes les commandes de l'utilisateur
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),

      // Tous les items commandés pour analyses
      prisma.orderItem.findMany({
        where: { order: { userId } },
        include: {
          work: {
            include: {
              discipline: true,
              author: { select: { name: true } }
            }
          },
          order: true
        }
      })
    ])

    // **1. MÉTRIQUES PRINCIPALES**
    const totalOrders = orders.length
    const totalBooks = allOrderItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = allOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length

    // **2. ÉVOLUTION MENSUELLE (6 derniers mois)**
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyStats = orders
      .filter(order => order.createdAt >= sixMonthsAgo)
      .reduce((acc, order) => {
        const monthKey = order.createdAt.toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'short' 
        })
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, commandes: 0, montant: 0, livres: 0 }
        }
        
        acc[monthKey].commandes += 1
        acc[monthKey].montant += order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        acc[monthKey].livres += order.items.reduce((sum, item) => sum + item.quantity, 0)
        
        return acc
      }, {} as Record<string, { month: string; commandes: number; montant: number; livres: number }>)

    const purchaseHistory = Object.values(monthlyStats)

    // **3. PRÉFÉRENCES PAR DISCIPLINE**
    const disciplineStats = allOrderItems.reduce((acc, item) => {
      const discipline = item.work.discipline.name
      if (!acc[discipline]) {
        acc[discipline] = { name: discipline, quantity: 0, amount: 0 }
      }
      acc[discipline].quantity += item.quantity
      acc[discipline].amount += item.price * item.quantity
      return acc
    }, {} as Record<string, { name: string; quantity: number; amount: number }>)

    const categoryPreferences = Object.values(disciplineStats)
      .map((stat, index) => ({
        name: stat.name,
        value: stat.quantity,
        amount: stat.amount,
        color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]
      }))

    // **4. COMMANDES RÉCENTES (5 dernières)**
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      date: order.createdAt.toISOString(),
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: order.status
    }))

    // **5. TOP AUTEURS**
    const authorStats = allOrderItems.reduce((acc, item) => {
      const author = item.work.author?.name || 'Auteur inconnu'
      if (!acc[author]) {
        acc[author] = { name: author, books: 0, amount: 0 }
      }
      acc[author].books += item.quantity
      acc[author].amount += item.price * item.quantity
      return acc
    }, {} as Record<string, { name: string; books: number; amount: number }>)

    const topAuthors = Object.values(authorStats)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // **6. HABITUDES D'ACHAT**
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0
    const averageBooksPerOrder = totalOrders > 0 ? totalBooks / totalOrders : 0
    const monthlyFrequency = purchaseHistory.length > 0 
      ? purchaseHistory.reduce((sum, month) => sum + month.commandes, 0) / purchaseHistory.length 
      : 0

    // **7. COMPARAISONS (mois actuel vs précédent)**
    const currentMonth = new Date().getMonth()
    const currentMonthOrders = orders.filter(order => 
      order.createdAt.getMonth() === currentMonth
    )
    const previousMonthOrders = orders.filter(order => 
      order.createdAt.getMonth() === (currentMonth - 1 + 12) % 12
    )

    const currentMonthAmount = currentMonthOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
    )
    const previousMonthAmount = previousMonthOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0), 0
    )

    return NextResponse.json({
      // Métriques principales
      metrics: {
        totalOrders,
        totalBooks,
        totalAmount,
        deliveredOrders,
        averageOrderValue: Math.round(averageOrderValue),
        averageBooksPerOrder: Math.round(averageBooksPerOrder * 10) / 10,
        monthlyFrequency: Math.round(monthlyFrequency * 10) / 10
      },

      // Évolution temporelle
      purchaseHistory,

      // Préférences
      categoryPreferences,
      topAuthors,

      // Données récentes
      recentOrders,

      // Comparaisons
      comparison: {
        currentMonth: {
          orders: currentMonthOrders.length,
          amount: currentMonthAmount
        },
        previousMonth: {
          orders: previousMonthOrders.length,
          amount: previousMonthAmount
        },
        growth: {
          orders: currentMonthOrders.length - previousMonthOrders.length,
          amount: currentMonthAmount - previousMonthAmount,
          ordersPercent: previousMonthOrders.length > 0 
            ? Math.round(((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100)
            : 0,
          amountPercent: previousMonthAmount > 0 
            ? Math.round(((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100)
            : 0
        }
      },

      // Profil utilisateur
      profile: {
        level: totalAmount >= 100000 ? 'Gold' : totalAmount >= 50000 ? 'Silver' : 'Bronze',
        points: Math.floor(totalAmount / 100), // 1 point par 100 FCFA
        nextLevelPoints: totalAmount >= 100000 ? 200000 : totalAmount >= 50000 ? 100000 : 50000
      }
    })

  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



