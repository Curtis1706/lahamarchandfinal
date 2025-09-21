import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET - Récupérer les notifications du PDG
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching notifications for PDG:", user.name)

    // Récupérer les notifications du PDG
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id }, // Notifications personnelles
          { type: "SYSTEM_WIDE" }, // Notifications système
          { type: "PDG_ALERT" } // Alertes PDG
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limiter à 50 notifications récentes
    })

    // Récupérer les statistiques des notifications
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      urgent: notifications.filter(n => n.type === "PDG_ALERT").length,
      system: notifications.filter(n => n.type === "SYSTEM_WIDE").length
    }

    console.log(`👑 PDG notifications: ${stats.total} total, ${stats.unread} unread`)

    return NextResponse.json({
      notifications,
      stats,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Marquer les notifications comme lues ou créer une notification
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { action, notificationIds, notification } = body

    if (action === "mark_read") {
      // Marquer les notifications comme lues
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json({ 
          error: "Missing required field: notificationIds" 
        }, { status: 400 })
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: { read: true, readAt: new Date() }
      })

      console.log(`✅ Marked ${notificationIds.length} notifications as read`)

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notifications marquées comme lues`
      })

    } else if (action === "create") {
      // Créer une nouvelle notification
      if (!notification || !notification.title || !notification.message) {
        return NextResponse.json({ 
          error: "Missing required fields: notification.title, notification.message" 
        }, { status: 400 })
      }

      const newNotification = await prisma.notification.create({
        data: {
          userId: notification.userId || user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || "INFO",
          data: notification.data || {}
        }
      })

      console.log(`✅ Created notification: ${newNotification.title}`)

      return NextResponse.json({
        success: true,
        notification: newNotification,
        message: "Notification créée avec succès"
      })

    } else {
      return NextResponse.json({ 
        error: "Invalid action. Use 'mark_read' or 'create'" 
      }, { status: 400 })
    }

  } catch (error) {
    console.error("❌ Error processing PDG notification action:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE - Supprimer des notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const notificationIds = searchParams.get("ids")

    if (!notificationIds) {
      return NextResponse.json({ 
        error: "Missing required parameter: ids" 
      }, { status: 400 })
    }

    const ids = notificationIds.split(",")

    await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id
      }
    })

    console.log(`✅ Deleted ${ids.length} notifications`)

    return NextResponse.json({
      success: true,
      message: `${ids.length} notifications supprimées`
    })

  } catch (error) {
    console.error("❌ Error deleting PDG notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
