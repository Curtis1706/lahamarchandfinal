import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les notifications du client
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔔 Fetching notifications for user:", user.id)

    // Pour l'instant, nous allons générer des notifications basées sur les commandes
    // Dans un vrai système, vous auriez une table Notification dédiée
    
    // Récupérer les commandes récentes pour générer des notifications
    const recentOrders = await prisma.order.findMany({
      where: { 
        userId: user.id,
        status: {
          not: "CANCELLED"
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    // Générer des notifications basées sur les commandes
    const notifications = []
    
    for (const order of recentOrders) {
      const orderNumber = `#${order.id.slice(-8).toUpperCase()}`
      
      // Notification de commande passée
      notifications.push({
        id: `order-${order.id}`,
        type: "order",
        title: "Commande passée",
        message: `Votre commande ${orderNumber} a été enregistrée avec succès`,
        date: order.createdAt,
        read: false,
        priority: "medium",
        icon: "🛒",
        action: {
          type: "view_order",
          orderId: order.id
        }
      })

      // Si la commande est validée, ajouter une notification
      if (order.status === "VALIDATED") {
        notifications.push({
          id: `validated-${order.id}`,
          type: "order",
          title: "Commande validée",
          message: `Votre commande ${orderNumber} a été validée et est en préparation`,
          date: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 jour
          read: false,
          priority: "high",
          icon: "✅",
          action: {
            type: "view_order",
            orderId: order.id
          }
        })
      }

      // Si la commande est livrée, ajouter une notification
      if (order.status === "DELIVERED") {
        notifications.push({
          id: `delivered-${order.id}`,
          type: "delivery",
          title: "Commande livrée",
          message: `Votre commande ${orderNumber} a été livrée avec succès`,
          date: new Date(order.createdAt.getTime() + 72 * 60 * 60 * 1000), // +3 jours
          read: false,
          priority: "high",
          icon: "🏠",
          action: {
            type: "view_order",
            orderId: order.id
          }
        })
      }
    }

    // Ajouter des notifications système
    notifications.push({
      id: "welcome",
      type: "system",
      title: "Bienvenue sur Laha Marchand",
      message: "Découvrez notre catalogue de livres et suivez vos commandes en temps réel",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // -7 jours
      read: true,
      priority: "low",
      icon: "👋",
      action: {
        type: "view_catalog"
      }
    })

    // Ajouter des notifications de nouveautés
    const recentWorks = await prisma.work.findMany({
      where: {
        status: { in: ["ON_SALE", "PUBLISHED"] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // -30 jours
        }
      },
      include: {
        discipline: true,
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 3
    })

    for (const work of recentWorks) {
      notifications.push({
        id: `new-work-${work.id}`,
        type: "catalog",
        title: "Nouveauté disponible",
        message: `"${work.title}" de ${work.author?.name || "Auteur inconnu"} est maintenant disponible`,
        date: work.createdAt,
        read: false,
        priority: "medium",
        icon: "📚",
        action: {
          type: "view_work",
          workId: work.id
        }
      })
    }

    // Trier par date (plus récentes en premier)
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculer les statistiques
    const unreadCount = notifications.filter(n => !n.read).length
    const highPriorityCount = notifications.filter(n => n.priority === "high" && !n.read).length

    console.log(`🔔 Found ${notifications.length} notifications for user (${unreadCount} unread)`)

    return NextResponse.json({
      notifications,
      summary: {
        total: notifications.length,
        unread: unreadCount,
        highPriority: highPriorityCount,
        byType: {
          order: notifications.filter(n => n.type === "order").length,
          delivery: notifications.filter(n => n.type === "delivery").length,
          catalog: notifications.filter(n => n.type === "catalog").length,
          system: notifications.filter(n => n.type === "system").length
        }
      }
    })

  } catch (error) {
    console.error("❌ Error fetching notifications:", error)
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

    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId || !action) {
      return NextResponse.json({ error: "Notification ID and action are required" }, { status: 400 })
    }

    // Pour l'instant, nous simulons juste le marquage comme lu
    // Dans un vrai système, vous mettriez à jour la base de données
    
    console.log(`🔔 Notification ${notificationId} marked as ${action} for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: `Notification ${action} successfully`
    })

  } catch (error) {
    console.error("❌ Error updating notification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "mark_all_read") {
      console.log(`🔔 All notifications marked as read for user ${user.id}`)
      
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("❌ Error updating notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



