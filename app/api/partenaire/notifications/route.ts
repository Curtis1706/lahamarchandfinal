import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
  try {
    logger.debug("🔔 Starting partenaire notifications fetch...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un partenaire
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== Role.PARTENAIRE) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les informations du partenaire, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findUnique({
      where: { userId: user.id }
    })

    if (!partner) {
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        logger.debug("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: "Erreur lors de la création du partenaire" }, { status: 500 })
      }
    }

    logger.debug("✅ User found:", user.name, user.role)

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
    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      priority: notif.type.includes('URGENT') || notif.type.includes('CRITICAL') ? 'high' : 
                notif.type.includes('WARNING') ? 'medium' : 'low',
      read: notif.read,
      createdAt: notif.createdAt,
      data: notif.data ? JSON.parse(notif.data) : null
    }))

    const summary = {
      total: formattedNotifications.length,
      unread: formattedNotifications.filter(n => !n.read).length,
      highPriority: formattedNotifications.filter(n => n.priority === "high").length
    }

    logger.debug("✅ Notifications prepared:", summary)

    return NextResponse.json({ notifications: formattedNotifications, summary })

  } catch (error) {
    logger.error("❌ Error fetching partenaire notifications:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    logger.debug("🔔 Marking partenaire notifications as read...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un partenaire
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== Role.PARTENAIRE) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await req.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "notificationIds requis" }, { status: 400 })
    }

    // Marquer les notifications comme lues dans la base de données
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id
      },
      data: {
        read: true
      }
    })

    logger.debug(`✅ ${updateResult.count} notifications marquées comme lues`)

    return NextResponse.json({ 
      success: true, 
      updatedCount: updateResult.count 
    })

  } catch (error) {
    logger.error("❌ Error marking notifications as read:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    )
  }
}

