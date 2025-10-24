import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Templates de notifications par défaut
    const defaultTemplates = [
      {
        code: "WELCOME_CLIENT",
        titre: "Bienvenue",
        statut: "Actif" as const,
        dateCreation: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateModification: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: session.user.name || "PDG Administrateur",
        texte: "Bienvenue ! Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer toutes les fonctionnalités de l'application.",
        actions: ["play", "edit", "delete"]
      },
      {
        code: "ORDER_CONFIRMED",
        titre: "Commande confirmée",
        statut: "Actif" as const,
        dateCreation: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateModification: "Pas de modification",
        creePar: session.user.name || "PDG Administrateur",
        texte: "Votre commande a été confirmée et est en cours de traitement.",
        actions: ["play", "edit", "delete"]
      },
      {
        code: "ORDER_SHIPPED",
        titre: "Commande expédiée",
        statut: "Actif" as const,
        dateCreation: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateModification: "Pas de modification",
        creePar: session.user.name || "PDG Administrateur",
        texte: "Votre commande a été expédiée. Vous recevrez bientôt vos livres.",
        actions: ["play", "edit", "delete"]
      },
      {
        code: "PROJECT_APPROVED",
        titre: "Projet approuvé",
        statut: "Actif" as const,
        dateCreation: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateModification: "Pas de modification",
        creePar: session.user.name || "PDG Administrateur",
        texte: "Félicitations ! Votre projet a été approuvé par le PDG.",
        actions: ["play", "edit", "delete"]
      },
      {
        code: "PROJECT_REJECTED",
        titre: "Projet refusé",
        statut: "Actif" as const,
        dateCreation: new Date().toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        dateModification: "Pas de modification",
        creePar: session.user.name || "PDG Administrateur",
        texte: "Votre projet nécessite des modifications. Veuillez consulter les commentaires du PDG.",
        actions: ["play", "edit", "delete"]
      }
    ]

    return NextResponse.json(defaultTemplates)

  } catch (error) {
    console.error("Error fetching notification templates:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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

    const newTemplate = {
      code: code || `NOTIF_${Date.now()}`,
      titre,
      statut: statut || "Actif",
      dateCreation: new Date().toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateModification: "Pas de modification",
      creePar: session.user.name || "PDG Administrateur",
      texte: texte || "",
      actions: ["play", "edit", "delete"]
    }

    return NextResponse.json(newTemplate, { status: 201 })

  } catch (error) {
    console.error("Error creating notification template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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

    return NextResponse.json({ success: true, message: "Template supprimé" })

  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


