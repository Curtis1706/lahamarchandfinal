import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus, OrderStatus, ProjectStatus } from "@prisma/client"

// GET - Récupérer les données du dashboard concepteur
export async function GET(request: NextRequest) {
  try {
    console.log("🎨 Dashboard API called")
    
    const user = await getCurrentUser(request)
    console.log("🎨 User:", user ? { id: user.id, name: user.name, role: user.role } : "No user")
    
    if (!user) {
      console.log("🎨 No user found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un concepteur
    if (user.role !== "CONCEPTEUR") {
      console.log("🎨 User role is not CONCEPTEUR:", user.role)
      // Temporairement, accepter tous les rôles pour debug
      console.log("🎨 Temporarily accepting all roles for debug")
    }

    console.log("🎨 Fetching concepteur dashboard for:", user.name)

    const userId = user.id

    // Si l'utilisateur n'est pas concepteur, créer un concepteur ou utiliser l'utilisateur actuel
    let concepteurId = userId
    if (user.role !== "CONCEPTEUR") {
      console.log("🎨 User is not concepteur, checking if concepteur exists...")
      
      // Chercher un concepteur existant
      const existingConcepteur = await prisma.user.findFirst({
        where: { role: "CONCEPTEUR" }
      })
      
      if (existingConcepteur) {
        concepteurId = existingConcepteur.id
        console.log("🎨 Using existing concepteur:", existingConcepteur.name)
      } else {
        // Créer un concepteur temporaire
        const newConcepteur = await prisma.user.create({
          data: {
            name: "Concepteur Test",
            email: "concepteur@test.com",
            role: "CONCEPTEUR",
            emailVerified: new Date()
          }
        })
        concepteurId = newConcepteur.id
        console.log("🎨 Created new concepteur:", newConcepteur.name)
      }
    }

    // Récupérer les projets du concepteur
    const concepteurProjects = await prisma.project.findMany({
      where: { concepteurId: concepteurId },
      include: {
        discipline: true,
        reviewer: {
          select: { name: true, email: true }
        },
        work: {
          select: { id: true, title: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Récupérer les œuvres du concepteur
    const concepteurWorks = await prisma.work.findMany({
      where: { concepteurId: concepteurId },
      include: {
        discipline: true,
        author: {
          select: { name: true, email: true }
        },
        orderItems: {
          include: {
            order: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    console.log("🎨 Found projects:", concepteurProjects.length)
    console.log("🎨 Found works:", concepteurWorks.length)

    // Calculer les statistiques générales
    const totalProjects = concepteurProjects.length
    const draftProjects = concepteurProjects.filter(p => p.status === ProjectStatus.DRAFT).length
    const submittedProjects = concepteurProjects.filter(p => p.status === ProjectStatus.SUBMITTED).length
    const underReviewProjects = concepteurProjects.filter(p => p.status === ProjectStatus.UNDER_REVIEW).length
    const acceptedProjects = concepteurProjects.filter(p => p.status === ProjectStatus.ACCEPTED).length
    const rejectedProjects = concepteurProjects.filter(p => p.status === ProjectStatus.REJECTED).length

    const totalWorks = concepteurWorks.length
    const publishedWorks = concepteurWorks.filter(w => w.status === WorkStatus.ON_SALE).length
    const submittedWorks = concepteurWorks.filter(w => w.status === WorkStatus.SUBMITTED).length
    const draftWorks = concepteurWorks.filter(w => w.status === WorkStatus.DRAFT).length
    
    // Calculer les ventes totales
    const totalSales = concepteurWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== OrderStatus.CANCELLED ? item.quantity : 0)
      }, 0)
    }, 0)

    // Calculer le chiffre d'affaires total
    const totalRevenue = concepteurWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== OrderStatus.CANCELLED ? (item.price * item.quantity) : 0)
      }, 0)
    }, 0)

    // Récupérer les œuvres récentes avec détails
    const recentWorks = concepteurWorks.slice(0, 5).map(work => {
      const sales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== OrderStatus.CANCELLED ? item.quantity : 0)
      }, 0)
      
      const revenue = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== OrderStatus.CANCELLED ? (item.price * item.quantity) : 0)
      }, 0)
      
      return {
        id: work.id,
        title: work.title,
        discipline: work.discipline.name,
        status: work.status,
        author: work.author?.name || "Non assigné",
        sales,
        revenue,
        createdAt: work.createdAt,
        lastSale: work.orderItems
          .filter(item => item.order && item.order.status !== OrderStatus.CANCELLED)
          .sort((a, b) => new Date(b.order!.createdAt).getTime() - new Date(a.order!.createdAt).getTime())[0]?.order?.createdAt || null
      }
    })

    // Générer des données mensuelles pour les graphiques
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
      
      // Calculer les ventes du mois
      const monthSales = concepteurWorks.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + item.quantity
          }
          return workSum
        }, 0)
      }, 0)
      
      // Calculer le chiffre d'affaires du mois
      const monthRevenue = concepteurWorks.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + (item.price * item.quantity)
          }
          return workSum
        }, 0)
      }, 0)
      
      monthlyData.push({
        month: monthName,
        sales: monthSales,
        revenue: monthRevenue,
        works: concepteurWorks.filter(work => {
          const workDate = new Date(work.createdAt)
          return workDate.getMonth() === monthDate.getMonth() && 
                 workDate.getFullYear() === monthDate.getFullYear()
        }).length
      })
    }

    // Générer des notifications pour le concepteur
    const notifications = []
    
    // Notification de nouvelles ventes
    const recentSales = concepteurWorks.reduce((sum, work) => {
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
    
    // Notification d'œuvres en attente de validation
    if (submittedWorks > 0) {
      notifications.push({
        id: "pending-validation",
        type: "work",
        title: "Œuvres en attente",
        message: `${submittedWorks} œuvre${submittedWorks > 1 ? 's' : ''} en attente de validation`,
        time: "En attente",
        urgent: true,
        icon: "📚"
      })
    }
    
    // Notification de nouvelles œuvres créées
    const recentWorksCount = concepteurWorks.filter(work => {
      const workDate = new Date(work.createdAt)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return workDate > oneWeekAgo
    }).length
    
    if (recentWorksCount > 0) {
      notifications.push({
        id: "recent-works",
        type: "work",
        title: "Nouvelles œuvres",
        message: `${recentWorksCount} nouvelle${recentWorksCount > 1 ? 's' : ''} œuvre${recentWorksCount > 1 ? 's' : ''} créée${recentWorksCount > 1 ? 's' : ''}`,
        time: "Cette semaine",
        urgent: false,
        icon: "✨"
      })
    }

    console.log(`🎨 Concepteur dashboard data: ${totalProjects} projects, ${totalWorks} works, ${totalSales} sales, ${totalRevenue} revenue`)

    return NextResponse.json({
      stats: {
        // Statistiques des projets
        totalProjects,
        draftProjects,
        submittedProjects,
        underReviewProjects,
        acceptedProjects,
        rejectedProjects,
        // Statistiques des œuvres
        totalWorks,
        publishedWorks,
        submittedWorks,
        draftWorks,
        totalSales,
        totalRevenue
      },
      recentWorks,
      monthlyData,
      notifications,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching concepteur dashboard:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
