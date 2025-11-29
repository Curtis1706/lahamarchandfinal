import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/remises - Récupérer les remises
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les remises depuis la base de données
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données pour le frontend
    const formattedDiscounts = discounts.map(discount => ({
      id: discount.id,
      client: discount.client,
      livre: discount.livre,
      quantiteMin: discount.quantiteMin,
      remise: discount.reduction,
      statut: discount.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      creeLe: discount.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: discount.createdBy,
      description: discount.description || "",
      type: discount.type,
      image: discount.image || "/placeholder.jpg"
    }))

    return NextResponse.json(formattedDiscounts)

  } catch (error) {
    console.error("Error fetching remises:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/remises - Créer une remise
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { client, livre, quantiteMin, remise, statut, description, type, image } = await request.json()

    // Validation des données
    if (!client || !livre || !remise) {
      return NextResponse.json({ error: "Client, livre et montant requis" }, { status: 400 })
    }

    // Créer la remise dans la base de données
    const newDiscount = await prisma.discount.create({
      data: {
        client,
        livre,
        quantiteMin: parseInt(quantiteMin) || 1,
        reduction: parseFloat(remise),
        statut: statut === "Inactif" ? "INACTIF" : "ACTIF",
        description: description || "",
        type: type || "Montant",
        image: image || "/placeholder.jpg",
        createdBy: session.user.name || session.user.email || "PDG Administrateur"
      }
    })

    // Formater la réponse
    const formattedDiscount = {
      id: newDiscount.id,
      client: newDiscount.client,
      livre: newDiscount.livre,
      quantiteMin: newDiscount.quantiteMin,
      remise: newDiscount.reduction,
      statut: newDiscount.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      creeLe: newDiscount.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: newDiscount.createdBy,
      description: newDiscount.description || "",
      type: newDiscount.type,
      image: newDiscount.image || "/placeholder.jpg"
    }

    return NextResponse.json(formattedDiscount, { status: 201 })

  } catch (error) {
    console.error("Error creating remise:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/pdg/remises - Modifier une remise
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, client, livre, quantiteMin, remise, statut, description, type, image } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Mettre à jour la remise dans la base de données
    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: {
        client,
        livre,
        quantiteMin: parseInt(quantiteMin) || 1,
        reduction: parseFloat(remise),
        statut: statut === "Inactif" ? "INACTIF" : "ACTIF",
        description: description || "",
        type: type || "Montant",
        image: image || "/placeholder.jpg"
      }
    })

    // Formater la réponse
    const formattedDiscount = {
      id: updatedDiscount.id,
      client: updatedDiscount.client,
      livre: updatedDiscount.livre,
      quantiteMin: updatedDiscount.quantiteMin,
      remise: updatedDiscount.reduction,
      statut: updatedDiscount.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      creeLe: updatedDiscount.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      modifieLe: updatedDiscount.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: updatedDiscount.createdBy,
      description: updatedDiscount.description || "",
      type: updatedDiscount.type,
      image: updatedDiscount.image || "/placeholder.jpg"
    }

    return NextResponse.json(formattedDiscount)

  } catch (error) {
    console.error("Error updating remise:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/remises - Supprimer une remise
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

    // Supprimer la remise de la base de données
    await prisma.discount.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Remise supprimée" })

  } catch (error) {
    console.error("Error deleting remise:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


