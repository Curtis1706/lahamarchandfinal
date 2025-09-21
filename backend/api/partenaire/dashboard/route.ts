import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus } from "@prisma/client"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || session.user.role !== Role.PARTENAIRE) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const userId = session.user.id

  try {
    console.log("🏢 Getting partner dashboard data...")

    // Récupérer les informations du partenaire
    const partner = await prisma.partner.findUnique({
      where: { userId },
      include: {
        representant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ error: "Partenaire introuvable" }, { status: 404 })
    }

    console.log("✅ Partner found:", partner.name)

    // Statistiques des commandes
    const orders = await prisma.order.findMany({
      where: { partnerId: partner.id },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculer les statistiques
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length
    const validatedOrders = orders.filter(o => o.status === OrderStatus.VALIDATED).length
    const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length
    const totalValue = orders.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => orderSum + item.price, 0)
    }, 0)

    // Commandes récentes (5 dernières)
    const recentOrders = orders.slice(0, 5).map(order => ({
      id: order.id,
      status: order.status,
      total: order.items.reduce((sum, item) => sum + item.price, 0),
      itemCount: order.items.length,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        amount: item.price,
        work: {
          id: item.work.id,
          title: item.work.title,
          isbn: item.work.isbn,
          discipline: item.work.discipline.name,
          author: item.work.author?.name || "Auteur inconnu"
        }
      }))
    }))

    // Données pour le graphique (6 derniers mois)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const chartData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthOrders = orders.filter(order => 
        order.createdAt >= monthStart && order.createdAt <= monthEnd
      )

      chartData.push({
        month: date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
        commandes: monthOrders.length,
        montant: monthOrders.reduce((sum, order) => {
          return sum + order.items.reduce((orderSum, item) => orderSum + item.price, 0)
        }, 0)
      })
    }

    // Top œuvres commandées
    const workStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const workId = item.work.id
        if (workStats.has(workId)) {
          const stats = workStats.get(workId)
          stats.totalQuantity += item.quantity
          stats.totalValue += item.price
          stats.orderCount += 1
        } else {
          workStats.set(workId, {
            work: {
              id: item.work.id,
              title: item.work.title,
              isbn: item.work.isbn,
              discipline: item.work.discipline.name,
              author: item.work.author?.name || "Auteur inconnu"
            },
            totalQuantity: item.quantity,
            totalValue: item.price,
            orderCount: 1
          })
        }
      })
    })

    const topWorks = Array.from(workStats.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)

    const response = {
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        address: partner.address,
        phone: partner.phone,
        email: partner.email,
        contact: partner.contact,
        website: partner.website,
        description: partner.description,
        representant: partner.representant
      },
      summary: {
        totalOrders,
        pendingOrders,
        validatedOrders,
        deliveredOrders,
        totalValue: Math.round(totalValue),
        averageOrderValue: totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0
      },
      recentOrders,
      chartData,
      topWorks
    }

    console.log("✅ Partner dashboard data prepared:", {
      totalOrders,
      totalValue: Math.round(totalValue),
      recentOrdersCount: recentOrders.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching partner dashboard data:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des données du tableau de bord" },
      { status: 500 }
    )
  }
}
