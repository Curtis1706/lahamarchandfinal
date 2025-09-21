import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔔 Starting representant notifications fetch...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    console.log("✅ User found:", user.name, user.role)

    // Pour l'instant, on génère les notifications dynamiquement
    // TODO: Utiliser le modèle Notification quand il sera disponible
    const existingNotifications = []

    // Générer des notifications basées sur les commandes
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
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
      orderBy: { createdAt: "desc" },
      take: 20
    })

    const notifications = []

    // Notifications pour les commandes récentes
    for (const order of orders) {
      const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const commission = orderTotal * 0.10 // 10% de commission

      // Notification de création de commande
      notifications.push({
        id: `order-created-${order.id}`,
        type: "order",
        title: "Commande créée",
        message: `Votre commande ${order.id} a été créée pour ${Math.round(orderTotal)} FCFA (Commission: ${Math.round(commission)} FCFA)`,
        date: order.createdAt,
        read: false,
        priority: "medium",
        icon: "Package",
        action: {
          type: "view_order",
          orderId: order.id
        }
      })

      // Notification de validation de commande
      if (order.status === "VALIDATED") {
        notifications.push({
          id: `order-validated-${order.id}`,
          type: "order",
          title: "Commande validée",
          message: `Votre commande ${order.id} a été validée par le PDG. Commission: ${Math.round(commission)} FCFA`,
          date: order.updatedAt,
          read: false,
          priority: "high",
          icon: "CheckCircle",
          action: {
            type: "view_order",
            orderId: order.id
          }
        })
      }

      // Notification de livraison
      if (order.status === "DELIVERED") {
        notifications.push({
          id: `order-delivered-${order.id}`,
          type: "delivery",
          title: "Commande livrée",
          message: `Votre commande ${order.id} a été livrée avec succès. Commission payée: ${Math.round(commission)} FCFA`,
          date: order.updatedAt,
          read: false,
          priority: "high",
          icon: "Truck",
          action: {
            type: "view_order",
            orderId: order.id
          }
        })
      }
    }

    // Notifications système
    const totalCommissions = orders
      .filter(o => o.status === "DELIVERED")
      .reduce((sum, order) => {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        return sum + (orderTotal * 0.10)
      }, 0)

    if (totalCommissions > 0) {
      notifications.push({
        id: "commission-summary",
        type: "system",
        title: "Résumé des commissions",
        message: `Total des commissions gagnées: ${Math.round(totalCommissions)} FCFA`,
        date: new Date(),
        read: false,
        priority: "low",
        icon: "TrendingUp",
        action: {
          type: "view_commissions"
        }
      })
    }

    // Trier les notifications par date
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Limiter à 20 notifications
    const finalNotifications = notifications.slice(0, 20)

    const response = {
      notifications: finalNotifications,
      summary: {
        total: finalNotifications.length,
        unread: finalNotifications.filter(n => !n.read).length,
        highPriority: finalNotifications.filter(n => n.priority === "high").length,
        byType: {
          order: finalNotifications.filter(n => n.type === "order").length,
          delivery: finalNotifications.filter(n => n.type === "delivery").length,
          catalog: finalNotifications.filter(n => n.type === "catalog").length,
          system: finalNotifications.filter(n => n.type === "system").length
        }
      }
    }

    console.log("✅ Notifications prepared:", {
      total: finalNotifications.length,
      unread: response.summary.unread,
      highPriority: response.summary.highPriority
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, action } = body

    if (action === "read") {
      // Marquer comme lu (simulation)
      console.log(`📖 Marking notification ${notificationId} as read`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("❌ Error updating notification:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    )
  }
}
