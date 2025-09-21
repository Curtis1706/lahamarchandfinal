import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus, OrderStatus } from "@prisma/client"

// GET - Récupérer les statistiques avancées de l'auteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    console.log("📊 Fetching author statistics for:", user.name)

    const userId = user.id

    // Récupérer toutes les œuvres de l'auteur avec leurs données
    const works = await prisma.work.findMany({
      where: { authorId: userId },
      include: {
        discipline: true,
        orderItems: {
          include: {
            order: true
          }
        },
        royalties: {
          where: { userId: userId }
        }
      }
    })

    // Statistiques générales
    const totalWorks = works.length
    const publishedWorks = works.filter(w => w.status === "ON_SALE").length
    const totalSales = works.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
    }, 0)

    const totalRevenue = works.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== "CANCELLED" ? (item.price * item.quantity) : 0)
      }, 0)
    }, 0)

    const totalRoyalties = works.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + royalty.amount
      }, 0)
    }, 0)

    const paidRoyalties = works.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + (royalty.paid ? royalty.amount : 0)
      }, 0)
    }, 0)

    // Statistiques par discipline
    const disciplineStats = works.reduce((acc, work) => {
      const discipline = work.discipline.name
      if (!acc[discipline]) {
        acc[discipline] = {
          works: 0,
          sales: 0,
          revenue: 0,
          royalties: 0
        }
      }
      
      acc[discipline].works += 1
      acc[discipline].sales += work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
      acc[discipline].revenue += work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== "CANCELLED" ? (item.price * item.quantity) : 0)
      }, 0)
      acc[discipline].royalties += work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
      
      return acc
    }, {} as Record<string, { works: number; sales: number; revenue: number; royalties: number }>)

    const disciplineBreakdown = Object.entries(disciplineStats).map(([discipline, stats]) => ({
      discipline,
      ...stats,
      percentage: totalWorks > 0 ? Math.round((stats.works / totalWorks) * 100) : 0
    })).sort((a, b) => b.works - a.works)

    // Top œuvres par ventes
    const topWorksBySales = works
      .map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
        }, 0)
        const revenue = work.orderItems.reduce((sum, item) => {
          return sum + (item.order && item.order.status !== "CANCELLED" ? (item.price * item.quantity) : 0)
        }, 0)
        const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
        
        return {
          id: work.id,
          title: work.title,
          discipline: work.discipline.name,
          sales,
          revenue,
          royalties,
          status: work.status,
          createdAt: work.createdAt
        }
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)

    // Données mensuelles pour les graphiques
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
      
      // Ventes du mois
      const monthSales = works.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && 
              new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + item.quantity
          }
          return workSum
        }, 0)
      }, 0)
      
      // Revenus du mois
      const monthRevenue = works.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && 
              new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + (item.price * item.quantity)
          }
          return workSum
        }, 0)
      }, 0)
      
      // Royalties du mois
      const monthRoyalties = works.reduce((sum, work) => {
        return sum + work.royalties.reduce((royaltySum, royalty) => {
          if (new Date(royalty.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(royalty.createdAt).getFullYear() === monthDate.getFullYear()) {
            return royaltySum + royalty.amount
          }
          return royaltySum
        }, 0)
      }, 0)
      
      monthlyData.push({
        month: monthName,
        sales: monthSales,
        revenue: monthRevenue,
        royalties: monthRoyalties
      })
    }

    // Comparaisons avec les mois précédents
    const currentMonth = monthlyData[monthlyData.length - 1]
    const previousMonth = monthlyData[monthlyData.length - 2]
    
    const comparisons = {
      sales: {
        current: currentMonth?.sales || 0,
        previous: previousMonth?.sales || 0,
        change: previousMonth ? 
          Math.round(((currentMonth?.sales || 0) - previousMonth.sales) / previousMonth.sales * 100) : 0
      },
      revenue: {
        current: currentMonth?.revenue || 0,
        previous: previousMonth?.revenue || 0,
        change: previousMonth ? 
          Math.round(((currentMonth?.revenue || 0) - previousMonth.revenue) / previousMonth.revenue * 100) : 0
      },
      royalties: {
        current: currentMonth?.royalties || 0,
        previous: previousMonth?.royalties || 0,
        change: previousMonth ? 
          Math.round(((currentMonth?.royalties || 0) - previousMonth.royalties) / previousMonth.royalties * 100) : 0
      }
    }

    // Métriques de performance
    const performanceMetrics = {
      averageSalesPerWork: totalWorks > 0 ? Math.round(totalSales / totalWorks) : 0,
      averageRevenuePerWork: totalWorks > 0 ? Math.round(totalRevenue / totalWorks) : 0,
      averageRoyaltiesPerWork: totalWorks > 0 ? Math.round(totalRoyalties / totalWorks) : 0,
      royaltyRate: totalRevenue > 0 ? Math.round((totalRoyalties / totalRevenue) * 100) : 0,
      conversionRate: totalWorks > 0 ? Math.round((publishedWorks / totalWorks) * 100) : 0
    }

    console.log(`📊 Author statistics: ${totalWorks} works, ${totalSales} sales, ${totalRoyalties} royalties`)

    return NextResponse.json({
      overview: {
        totalWorks,
        publishedWorks,
        totalSales,
        totalRevenue,
        totalRoyalties,
        paidRoyalties,
        pendingRoyalties: totalRoyalties - paidRoyalties
      },
      disciplineBreakdown,
      topWorksBySales,
      monthlyData,
      comparisons,
      performanceMetrics,
      user: {
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error("❌ Error fetching author statistics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
