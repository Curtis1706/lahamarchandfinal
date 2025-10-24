import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/notifications-diffusion - Récupérer les notifications diffusées
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les notifications envoyées depuis la base de données
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const formattedDiffusions = notifications.map(notif => ({
      id: notif.id,
      code: notif.type,
      titre: notif.title,
      statut: "Actif" as const,
      vue: notif.read ? "Oui" as const : "Non" as const,
      destinateur: notif.user.name + (notif.user.phone ? ` (${notif.user.phone})` : ""),
      expediteur: "PDG (Super)",
      dateCreation: notif.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      message: notif.message,
      actions: ["delete"]
    }))

    return NextResponse.json(formattedDiffusions)

  } catch (error) {
    console.error("Error fetching notifications diffusion:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/notifications-diffusion - Supprimer une diffusion
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Notification supprimée" })

  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

