import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET - Récupérer les notifications de l'auteur
export async function GET(request: NextRequest) {
  try {
    console.log("🔔 Starting author notifications fetch...")
    
    const user = await getCurrentUser(request)
    if (!user) {
      console.log("❌ No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ User found:", user.name, user.role)

    // Vérifier que l'utilisateur est un auteur
    if (user.role !== Role.AUTEUR) {
      console.log("❌ User is not an author:", user.role)
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    console.log("🔔 Fetching author notifications for:", user.name)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "20")

    const authorId = user.id

    console.log("🔍 Fetching works for author:", authorId)

    // Récupérer les œuvres de l'auteur pour générer des notifications
    const authorWorks = await prisma.work.findMany({
      where: { authorId },
      include: {
        orderItems: {
          include: {
            order: true
          }
        },
        royalties: true  // Simplifier pour éviter les erreurs
      }
    })

    console.log("✅ Found works:", authorWorks.length)

    // Récupérer les paiements récents
    const recentPayments = await prisma.royalty.findMany({
      where: { userId: authorId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        work: {
          select: { title: true }
        }
      }
    })

    console.log("✅ Found payments:", recentPayments.length)

    let notifications: any[] = []

    console.log("🔍 Generating notifications...")

    // Notification de bienvenue
    notifications.push({
      id: "welcome-author",
      type: "system",
      title: "Bienvenue dans votre espace auteur !",
      message: "Suivez vos œuvres, ventes et droits d'auteur en temps réel.",
      date: new Date(user.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000),
      read: true,
      priority: "low",
      link: "/dashboard/auteur",
      icon: "Bell"
    })

    // Notifications basées sur les œuvres
    authorWorks.forEach((work) => {
      console.log(`🔍 Processing work: ${work.title}`)
      
      const sales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)

      const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
      const royaltiesPaid = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)

      console.log(`📊 Work stats - Sales: ${sales}, Royalties: ${royalties}, Paid: ${royaltiesPaid}`)

      // Notification de nouvelles ventes
      if (sales > 0) {
        notifications.push({
          id: `sales-${work.id}`,
          type: "order",
          title: "Nouvelles ventes détectées",
          message: `${sales} exemplaires de "${work.title}" vendus`,
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          read: Math.random() > 0.5,
          priority: "medium",
          amount: sales * work.price * 0.15, // 15% de royalty
          link: "/dashboard/auteur/ventes",
          icon: "TrendingUp"
        })
      }

      // Notification de royalties générées
      if (royalties > 0) {
        notifications.push({
          id: `royalty-${work.id}`,
          type: "system",
          title: "Droits d'auteur calculés",
          message: `${royalties.toLocaleString()} FCFA de droits générés pour "${work.title}"`,
          date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          read: Math.random() > 0.3,
          priority: "high",
          amount: royalties,
          link: "/dashboard/auteur/paiements",
          icon: "DollarSign"
        })
      }
    })

    console.log("✅ Generated work notifications:", notifications.length)

    // Notifications de paiements
    recentPayments.forEach((payment) => {
      console.log(`🔍 Processing payment: ${payment.id}`)
      
      if (payment.paid) {
        notifications.push({
          id: `payment-${payment.id}`,
          type: "delivery",
          title: "Paiement effectué",
          message: `Virement de ${payment.amount.toLocaleString()} FCFA pour "${payment.work.title}"`,
          date: payment.createdAt,
          read: Math.random() > 0.2,
          priority: "high",
          amount: payment.amount,
          link: "/dashboard/auteur/paiements",
          icon: "DollarSign"
        })
      } else {
        notifications.push({
          id: `pending-${payment.id}`,
          type: "system",
          title: "Paiement en attente",
          message: `${payment.amount.toLocaleString()} FCFA en attente de versement`,
          date: payment.createdAt,
          read: false,
          priority: "medium",
          amount: payment.amount,
          link: "/dashboard/auteur/paiements",
          icon: "Clock"
        })
      }
    })

    console.log("✅ Generated payment notifications")

    // Notifications de milestones
    const totalSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
    }, 0)

    console.log("📊 Total sales:", totalSales)

    if (totalSales >= 100) {
      notifications.push({
        id: "milestone-100-sales",
        type: "catalog",
        title: "Objectif atteint !",
        message: `Félicitations ! Vous avez dépassé 100 ventes totales`,
        date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        read: Math.random() > 0.4,
        priority: "medium",
        link: "/dashboard/auteur/statistiques",
        icon: "Award"
      })
    }

    // Trier par date de création (plus récent en premier)
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Filtrer par catégorie
    let filteredNotifications = notifications
    if (category === "unread") {
      filteredNotifications = notifications.filter((n) => !n.read)
    } else if (category && category !== "all") {
      filteredNotifications = notifications.filter((n) => n.type === category)
    }

    console.log("✅ Generated milestone notifications")

    console.log("✅ Sorted notifications")

    console.log("✅ Filtered notifications:", filteredNotifications.length)

    // Calculer les statistiques
    const unreadCount = filteredNotifications.filter((n) => !n.read).length

    console.log("📊 Stats - Unread:", unreadCount)

    const response = {
      notifications: filteredNotifications.slice(0, limit),
      summary: {
        total: filteredNotifications.length,
        unread: unreadCount,
        highPriority: filteredNotifications.filter(n => n.priority === "high").length,
        byType: {
          order: filteredNotifications.filter(n => n.type === "order").length,
          delivery: filteredNotifications.filter(n => n.type === "delivery").length,
          catalog: filteredNotifications.filter(n => n.type === "catalog").length,
          system: filteredNotifications.filter(n => n.type === "system").length
        }
      }
    }

    console.log("✅ Final response prepared:", response.summary)

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching author notifications:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("❌ Error message:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH - Marquer une notification comme lue
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== Role.AUTEUR) {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
    }

    // Dans un vrai système, on sauvegarderait l'état des notifications en base
    // Pour l'instant, on simule juste le succès
    console.log(`📖 Marking notification ${notificationId} as read for author ${user.name}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
