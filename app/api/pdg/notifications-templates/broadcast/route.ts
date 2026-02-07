import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST /api/pdg/notifications-templates/broadcast - Diffuser un template de notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { code, targetRoles, targetUserIds } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Code du template requis" }, { status: 400 })
    }

    // Récupérer le template
    const template = await prisma.notificationTemplate.findUnique({
      where: { code }
    })

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 })
    }

    if (template.statut !== "Actif") {
      return NextResponse.json({ error: "Ce template n'est pas actif" }, { status: 400 })
    }

    // Déterminer les destinataires
    let recipients: { id: string }[] = []

    if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      // Envoyer à des utilisateurs spécifiques
      recipients = targetUserIds.map((id: string) => ({ id }))
    } else if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
      // Envoyer à des rôles spécifiques (limité pour éviter surcharge)
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: targetRoles
          },
          status: 'ACTIVE'
        },
        select: {
          id: true
        },
        take: 1000, // Limiter à 1000 utilisateurs max par rôle
        orderBy: { createdAt: 'desc' }
      })
      recipients = users
    } else {
      // Par défaut, envoyer à tous les utilisateurs actifs (LIMITÉ pour éviter surcharge)
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true
        },
        take: 1000, // CRITIQUE: Limiter à 1000 pour éviter surcharge mémoire
        orderBy: { createdAt: 'desc' }
      })
      recipients = users
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire trouvé" }, { status: 400 })
    }

    // Créer les notifications pour chaque destinataire
    const notifications = await prisma.notification.createMany({
      data: recipients.map(recipient => ({
        userId: recipient.id,
        title: template.titre,
        message: template.texte,
        type: template.code,
        read: false
      }))
    })

    return NextResponse.json({
      success: true,
      message: `Notification diffusée à ${notifications.count} utilisateur(s)`,
      count: notifications.count
    })

  } catch (error: any) {
    logger.error("Error broadcasting notification template:", error)
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 })
  }
}

