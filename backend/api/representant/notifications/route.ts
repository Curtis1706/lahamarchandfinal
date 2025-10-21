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

    // Récupérer les vraies notifications de la base de données
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Transformer pour le format attendu
    const finalNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type.toLowerCase(),
      title: notif.title,
      message: notif.message,
      date: notif.createdAt,
      read: notif.read,
      priority: notif.type.includes('URGENT') || notif.type.includes('CRITICAL') ? 'high' : 
                notif.type.includes('WARNING') ? 'medium' : 'low',
      icon: notif.type.includes('ORDER') ? 'Package' :
            notif.type.includes('WORK') ? 'BookOpen' :
            notif.type.includes('MESSAGE') ? 'Mail' : 'Bell',
      data: notif.data ? JSON.parse(notif.data) : null
    }))

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
    const { notificationId, notificationIds, action } = body

    if (action === "read") {
      if (notificationIds && Array.isArray(notificationIds)) {
        // Marquer plusieurs notifications comme lues
        await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id
          },
          data: {
            read: true
          }
        })
        console.log(`✅ ${notificationIds.length} notifications marquées comme lues`)
      } else if (notificationId) {
        // Marquer une seule notification comme lue
        await prisma.notification.update({
          where: {
            id: notificationId
          },
          data: {
            read: true
          }
        })
        console.log(`✅ Notification ${notificationId} marquée comme lue`)
      }
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
