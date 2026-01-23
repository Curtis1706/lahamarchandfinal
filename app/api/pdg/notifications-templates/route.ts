import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/notifications-templates - Récupérer les templates de notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les templates depuis la base de données (limité à 50)
    const templates = await prisma.notificationTemplate.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 templates (largement suffisant)
    })

    // Formater les templates pour le frontend
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      code: template.code,
      titre: template.titre,
      statut: template.statut,
      dateCreation: template.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateModification: template.updatedAt.getTime() !== template.createdAt.getTime()
        ? template.updatedAt.toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : "Pas de modification",
      creePar: template.createdBy.name || "PDG Administrateur",
      texte: template.texte,
      actions: ["play", "edit", "delete"]
    }))

    // Si aucun template, créer les templates par défaut
    if (formattedTemplates.length === 0) {
      const defaultTemplates = [
        {
          code: "WELCOME_CLIENT",
          titre: "Bienvenue",
          texte: "Bienvenue ! Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer toutes les fonctionnalités de l'application.",
          statut: "Actif"
        },
        {
          code: "ORDER_CONFIRMED",
          titre: "Commande confirmée",
          texte: "Votre commande a été confirmée et est en cours de traitement.",
          statut: "Actif"
        },
        {
          code: "ORDER_SHIPPED",
          titre: "Commande expédiée",
          texte: "Votre commande a été expédiée. Vous recevrez bientôt vos livres.",
          statut: "Actif"
        },
        {
          code: "PROJECT_APPROVED",
          titre: "Projet approuvé",
          texte: "Félicitations ! Votre projet a été approuvé par le PDG.",
          statut: "Actif"
        },
        {
          code: "PROJECT_REJECTED",
          titre: "Projet refusé",
          texte: "Votre projet nécessite des modifications. Veuillez consulter les commentaires du PDG.",
          statut: "Actif"
        }
      ]

      // Créer les templates par défaut
      await prisma.notificationTemplate.createMany({
        data: defaultTemplates.map(t => ({
          ...t,
          createdById: session.user.id
        }))
      })

      // Recharger les templates
      return GET(request)
    }

    return NextResponse.json(formattedTemplates)

  } catch (error: any) {
    logger.error("Error fetching notification templates:", error)
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 })
  }
}

// POST /api/pdg/notifications-templates - Créer un template de notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { code, titre, texte, statut } = await request.json()

    if (!code || !titre || !texte) {
      return NextResponse.json({ error: "Code, titre et texte sont requis" }, { status: 400 })
    }

    // Vérifier si un template avec ce code existe déjà
    const existing = await prisma.notificationTemplate.findUnique({
      where: { code }
    })

    if (existing) {
      return NextResponse.json({ error: "Un template avec ce code existe déjà" }, { status: 400 })
    }

    // Créer le template
    const newTemplate = await prisma.notificationTemplate.create({
      data: {
        code,
        titre,
        texte,
        statut: statut || "Actif",
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Formater la réponse
    const formattedTemplate = {
      id: newTemplate.id,
      code: newTemplate.code,
      titre: newTemplate.titre,
      statut: newTemplate.statut,
      dateCreation: newTemplate.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateModification: "Pas de modification",
      creePar: newTemplate.createdBy.name || "PDG Administrateur",
      texte: newTemplate.texte,
      actions: ["play", "edit", "delete"]
    }

    return NextResponse.json(formattedTemplate, { status: 201 })

  } catch (error: any) {
    logger.error("Error creating notification template:", error)
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 })
  }
}

// PUT /api/pdg/notifications-templates - Modifier un template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { code, titre, texte, statut } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 })
    }

    // Vérifier si le template existe
    const existing = await prisma.notificationTemplate.findUnique({
      where: { code }
    })

    if (!existing) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 })
    }

    // Mettre à jour le template
    const updatedTemplate = await prisma.notificationTemplate.update({
      where: { code },
      data: {
        ...(titre && { titre }),
        ...(texte && { texte }),
        ...(statut && { statut }),
        updatedById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Formater la réponse
    const formattedTemplate = {
      id: updatedTemplate.id,
      code: updatedTemplate.code,
      titre: updatedTemplate.titre,
      statut: updatedTemplate.statut,
      dateCreation: updatedTemplate.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateModification: updatedTemplate.updatedAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: updatedTemplate.createdBy.name || "PDG Administrateur",
      texte: updatedTemplate.texte,
      actions: ["play", "edit", "delete"]
    }

    return NextResponse.json(formattedTemplate)

  } catch (error: any) {
    logger.error("Error updating notification template:", error)
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 })
  }
}

// DELETE /api/pdg/notifications-templates - Supprimer un template
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
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 })
    }

    // Supprimer le template
    await prisma.notificationTemplate.delete({
      where: { code }
    })

    return NextResponse.json({ success: true, message: "Template supprimé" })

  } catch (error: any) {
    logger.error("Error deleting template:", error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 })
  }
}
