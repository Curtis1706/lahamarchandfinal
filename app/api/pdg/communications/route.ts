import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/communications - Récupérer les communications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les communications envoyées (basées sur les notifications)
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const communications = notifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type.toLowerCase().includes('announce') ? 'announcement' : 
            notif.type.toLowerCase().includes('promotion') ? 'promotion' :
            notif.type.toLowerCase().includes('policy') ? 'policy' : 'notification',
      targetAudience: [notif.user.role],
      status: notif.read ? 'sent' : 'scheduled',
      createdAt: notif.createdAt.toISOString(),
      scheduledFor: notif.createdAt.toISOString(),
      sentAt: notif.read ? notif.createdAt.toISOString() : undefined,
      recipients: 1,
      readCount: notif.read ? 1 : 0
    }))

    return NextResponse.json(communications)

  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/communications - Créer une communication
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { title, message, targetAudience, type } = await request.json()

    // Récupérer les utilisateurs de l'audience cible
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: targetAudience
        }
      }
    })

    // Créer une notification pour chaque utilisateur
    const notificationPromises = users.map(user => 
      prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message,
          type: type.toUpperCase(),
          read: false
        }
      })
    )

    await Promise.all(notificationPromises)

    return NextResponse.json({ 
      success: true, 
      message: `Communication envoyée à ${users.length} utilisateurs`,
      recipients: users.length
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating communication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

