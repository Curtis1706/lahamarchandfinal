import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus, OrderStatus } from "@prisma/client"

// GET - Récupérer les notifications du concepteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - Concepteur role required" }, { status: 403 })
    }

    console.log("🔔 Fetching concepteur notifications for:", user.name)

    const userId = user.id

    // Récupérer les œuvres du concepteur pour générer les notifications
    const works = await prisma.work.findMany({
      where: { concepteurId: userId },
      include: {
        discipline: true,
        author: { select: { name: true } },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                userId: true
              }
            }
          }
        }
      }
    })

    console.log("🔔 Found works for notifications:", works.length)

    // Générer les notifications basées sur les œuvres et leurs statuts
    const notifications = []

    // 1. Notifications de nouvelles ventes (dernières 24h)
    const recentSales = works.reduce((sum, work) => {
      return sum + work.orderItems.filter(item => {
        const orderDate = new Date(item.order?.createdAt || 0)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return orderDate > oneDayAgo && item.order?.status !== OrderStatus.CANCELLED
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
        icon: "📈",
        date: new Date()
      })
    }

    // 2. Notifications d'œuvres en attente de validation
    const submittedWorks = works.filter(w => w.status === WorkStatus.SUBMITTED)
    if (submittedWorks.length > 0) {
      notifications.push({
        id: "pending-validation",
        type: "validation",
        title: "Œuvres en attente de validation",
        message: `${submittedWorks.length} œuvre${submittedWorks.length > 1 ? 's' : ''} en attente de validation`,
        time: "En attente",
        urgent: true,
        icon: "📚",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Il y a 2 jours
      })
    }

    // 3. Notifications de nouvelles œuvres créées cette semaine
    const recentWorks = works.filter(work => {
      const workDate = new Date(work.createdAt)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return workDate > oneWeekAgo
    })

    if (recentWorks.length > 0) {
      notifications.push({
        id: "recent-works",
        type: "creation",
        title: "Nouvelles œuvres créées",
        message: `${recentWorks.length} nouvelle${recentWorks.length > 1 ? 's' : ''} œuvre${recentWorks.length > 1 ? 's' : ''} créée${recentWorks.length > 1 ? 's' : ''} cette semaine`,
        time: "Cette semaine",
        urgent: false,
        icon: "✨",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Il y a 3 jours
      })
    }

    // 4. Notifications de ventes par œuvre (top 3)
    const topSellingWorks = works
      .map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order?.status !== OrderStatus.CANCELLED ? item.quantity : 0)
        }, 0)
        return { work, sales }
      })
      .filter(item => item.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3)

    topSellingWorks.forEach((item, index) => {
      notifications.push({
        id: `top-sales-${item.work.id}`,
        type: "performance",
        title: "Performance de vente",
        message: `"${item.work.title}" a vendu ${item.sales} exemplaire${item.sales > 1 ? 's' : ''}`,
        time: "Cette semaine",
        urgent: false,
        icon: "🏆",
        date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
      })
    })

    // 5. Notifications de validation réussie (œuvres récemment publiées)
    const recentlyPublished = works.filter(work => {
      const workDate = new Date(work.createdAt)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return work.status === WorkStatus.ON_SALE && workDate > oneWeekAgo
    })

    recentlyPublished.forEach(work => {
      notifications.push({
        id: `published-${work.id}`,
        type: "publication",
        title: "Œuvre publiée",
        message: `"${work.title}" a été validée et mise en vente`,
        time: "Cette semaine",
        urgent: false,
        icon: "✅",
        date: work.createdAt
      })
    })

    // 6. Notifications de collaboration avec les auteurs
    const worksWithAuthors = works.filter(w => w.author)
    if (worksWithAuthors.length > 0) {
      notifications.push({
        id: "author-collaboration",
        type: "collaboration",
        title: "Collaboration avec les auteurs",
        message: `${worksWithAuthors.length} œuvre${worksWithAuthors.length > 1 ? 's' : ''} en collaboration avec des auteurs`,
        time: "En cours",
        urgent: false,
        icon: "👥",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      })
    }

    // Trier les notifications par date (plus récentes en premier)
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculer les statistiques des notifications
    const summary = {
      total: notifications.length,
      unread: notifications.length, // Toutes les notifications sont considérées comme non lues
      urgent: notifications.filter(n => n.urgent).length,
      byType: {
        sales: notifications.filter(n => n.type === "sales").length,
        validation: notifications.filter(n => n.type === "validation").length,
        creation: notifications.filter(n => n.type === "creation").length,
        performance: notifications.filter(n => n.type === "performance").length,
        publication: notifications.filter(n => n.type === "publication").length,
        collaboration: notifications.filter(n => n.type === "collaboration").length
      }
    }

    console.log(`🔔 Concepteur notifications: ${summary.total} total, ${summary.urgent} urgent`)

    return NextResponse.json({
      notifications,
      summary,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching concepteur notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


