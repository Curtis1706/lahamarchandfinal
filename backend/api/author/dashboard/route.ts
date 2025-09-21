import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus, OrderStatus } from "@prisma/client"

// GET - Récupérer les données du dashboard auteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un auteur
    if (user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    console.log("📚 Fetching author dashboard for:", user.name)
    console.log("📚 User ID:", user.id)
    console.log("📚 User role:", user.role)

    const userId = user.id

    // Récupérer les œuvres de l'auteur
    const authorWorks = await prisma.work.findMany({
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

    console.log("📚 Found works:", authorWorks.length)

    // Calculer les statistiques générales
    const totalWorks = authorWorks.length
    const publishedWorks = authorWorks.filter(w => w.status === "ON_SALE").length
    
    // Calculer les ventes totales
    const totalSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
    }, 0)

    // Calculer les royalties
    const totalRoyaltiesGenerated = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + royalty.amount
      }, 0)
    }, 0)

    const totalRoyaltiesPaid = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + (royalty.paid ? royalty.amount : 0)
      }, 0)
    }, 0)

    const totalRoyaltiesPending = totalRoyaltiesGenerated - totalRoyaltiesPaid

    // Récupérer les œuvres récentes avec détails
    const recentWorks = authorWorks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
        }, 0)
        
        const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
        const royaltiesPaid = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)
        
        return {
          id: work.id,
          title: work.title,
          discipline: work.discipline.name,
          status: work.status,
          sales,
          royaltiesGenerated: royalties,
          royaltiesPaid,
          royaltiesPending: royalties - royaltiesPaid,
          createdAt: work.createdAt,
          lastPayment: work.royalties
            .filter(r => r.paid)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt || null,
          nextPayment: work.royalties
            .filter(r => !r.paid)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.createdAt || null
        }
      })

    // Récupérer les paiements récents
    const recentPayments = await prisma.royalty.findMany({
      where: { userId: userId },
      include: {
        work: {
          select: {
            title: true,
            discipline: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const formattedPayments = recentPayments.map(royalty => ({
      id: royalty.id,
      amount: royalty.amount,
      paid: royalty.paid,
      createdAt: royalty.createdAt,
      workTitle: royalty.work.title,
      workDiscipline: royalty.work.discipline.name,
      status: royalty.paid ? "Payé" : "En attente"
    }))

    // Générer des données mensuelles pour les graphiques
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
      
      // Calculer les ventes du mois
      const monthSales = authorWorks.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + item.quantity
          }
          return workSum
        }, 0)
      }, 0)
      
      // Calculer les royalties du mois
      const monthRoyalties = authorWorks.reduce((sum, work) => {
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
        royalties: monthRoyalties,
        royaltiesPaid: authorWorks.reduce((sum, work) => {
          return sum + work.royalties.reduce((royaltySum, royalty) => {
            if (royalty.paid && new Date(royalty.createdAt).getMonth() === monthDate.getMonth() && 
                new Date(royalty.createdAt).getFullYear() === monthDate.getFullYear()) {
              return royaltySum + royalty.amount
            }
            return royaltySum
          }, 0)
        }, 0)
      })
    }

    // Générer des notifications pour l'auteur
    const notifications = []
    
    // Notification de nouvelles ventes
    const recentSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.filter(item => {
        const orderDate = new Date(item.order?.createdAt || 0)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return orderDate > oneDayAgo
      }).reduce((workSum, item) => workSum + item.quantity, 0)
    }, 0)
    
    if (recentSales > 0) {
      notifications.push({
        id: "recent-sales",
        type: "sales",
        title: "Nouvelles ventes",
        message: `${recentSales} exemplaire${recentSales > 1 ? 's' : ''} vendu${recentSales > 1 ? 's' : ''} aujourd'hui`,
        time: "Aujourd'hui",
        urgent: false,
        icon: "📈"
      })
    }
    
    // Notification de royalties en attente
    if (totalRoyaltiesPending > 0) {
      notifications.push({
        id: "pending-royalties",
        type: "payment",
        title: "Royalties en attente",
        message: `${totalRoyaltiesPending.toLocaleString()} FCFA à recevoir`,
        time: "En attente",
        urgent: true,
        icon: "💰"
      })
    }
    
    // Notification de nouvelles œuvres
    const recentWorksCount = authorWorks.filter(work => {
      const workDate = new Date(work.createdAt)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return workDate > oneWeekAgo
    }).length
    
    if (recentWorksCount > 0) {
      notifications.push({
        id: "recent-works",
        type: "work",
        title: "Nouvelle œuvre",
        message: `${recentWorksCount} nouvelle${recentWorksCount > 1 ? 's' : ''} œuvre${recentWorksCount > 1 ? 's' : ''} ajoutée${recentWorksCount > 1 ? 's' : ''}`,
        time: "Cette semaine",
        urgent: false,
        icon: "📚"
      })
    }

    console.log(`📚 Author dashboard data: ${totalWorks} works, ${totalSales} sales, ${totalRoyaltiesGenerated} royalties`)

    return NextResponse.json({
      stats: {
        totalWorks,
        publishedWorks,
        totalSales,
        totalRoyaltiesGenerated,
        totalRoyaltiesPaid,
        totalRoyaltiesPending
      },
      recentWorks,
      recentPayments: formattedPayments,
      monthlyData,
      notifications,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching author dashboard:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
