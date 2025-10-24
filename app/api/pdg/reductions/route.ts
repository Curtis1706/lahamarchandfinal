import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/reductions - Récupérer les réductions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Pour l'instant, on retourne des réductions par défaut
    // Dans un vrai système, il faudrait une table Discount dédiée
    const defaultReductions = [
      {
        id: "red-1",
        client: "Librairie",
        livre: "Tous les livres",
        quantiteMin: 10,
        reduction: 100,
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        description: "Réduction pour commande en volume",
        type: "Montant",
        image: "/communication-book.jpg"
      },
      {
        id: "red-2",
        client: "Librairie",
        livre: "Tous les livres",
        quantiteMin: 30,
        reduction: 200,
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        description: "Réduction volume important",
        type: "Montant",
        image: "/communication-book.jpg"
      },
      {
        id: "red-3",
        client: "Librairie",
        livre: "Tous les livres",
        quantiteMin: 50,
        reduction: 300,
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        description: "Réduction grande commande",
        type: "Montant",
        image: "/communication-book.jpg"
      }
    ]

    return NextResponse.json(defaultReductions)

  } catch (error) {
    console.error("Error fetching reductions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/reductions - Créer une réduction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { client, livre, quantiteMin, reduction, statut, description, type, image } = await request.json()

    // Dans un vrai système, il faudrait une table Discount dédiée
    const newReduction = {
      id: `red-${Date.now()}`,
      client,
      livre,
      quantiteMin: parseInt(quantiteMin) || 1,
      reduction: parseFloat(reduction) || 0,
      statut: statut || "Actif",
      creeLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: session.user.name || "PDG Administrateur",
      description: description || "",
      type: type || "Montant",
      image: image || "/placeholder.jpg"
    }

    return NextResponse.json(newReduction, { status: 201 })

  } catch (error) {
    console.error("Error creating reduction:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/pdg/reductions/[id] - Modifier une réduction
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, client, livre, quantiteMin, reduction, statut, description, type } = await request.json()

    const updatedReduction = {
      id,
      client,
      livre,
      quantiteMin: parseInt(quantiteMin) || 1,
      reduction: parseFloat(reduction) || 0,
      statut,
      description: description || "",
      type: type || "Montant",
      modifieLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(updatedReduction)

  } catch (error) {
    console.error("Error updating reduction:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/reductions/[id] - Supprimer une réduction
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

    return NextResponse.json({ success: true, message: "Réduction supprimée" })

  } catch (error) {
    console.error("Error deleting reduction:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

