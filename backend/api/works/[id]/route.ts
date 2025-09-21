import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WorkStatus } from "@prisma/client"

// GET /api/works/[id] - Récupérer une œuvre spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const work = await prisma.work.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        discipline: true,
        sales: true,
        royalties: true,
      }
    })

    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    return NextResponse.json(work)
  } catch (error) {
    console.error("Error fetching work:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/works/[id] - Modifier une œuvre
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, isbn, price, disciplineId, authorId, status } = body

    // Validation
    if (!title || !price || !disciplineId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier si l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: params.id }
    })

    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    // Mettre à jour l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: params.id },
      data: {
        title,
        isbn: isbn || null,
        price: parseFloat(price),
        disciplineId,
        authorId: authorId || null,
        status: status || existingWork.status,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        discipline: true,
      }
    })

    return NextResponse.json(updatedWork)
  } catch (error) {
    console.error("Error updating work:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/works/[id] - Supprimer une œuvre
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: params.id }
    })

    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    // Empêcher la suppression d'œuvres en vente ou publiées
    if (existingWork.status === WorkStatus.ON_SALE || existingWork.status === WorkStatus.PUBLISHED) {
      return NextResponse.json({ 
        error: "Cannot delete published or on-sale works" 
      }, { status: 400 })
    }

    // Supprimer l'œuvre
    await prisma.work.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Work deleted successfully" })
  } catch (error) {
    console.error("Error deleting work:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH /api/works/[id] - Changer le statut d'une œuvre (ex: soumettre pour validation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    // Validation
    if (!status || !Object.values(WorkStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Vérifier si l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: params.id }
    })

    if (!existingWork) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    // Valider les transitions de statut
    const validTransitions: Record<WorkStatus, WorkStatus[]> = {
      [WorkStatus.DRAFT]: [WorkStatus.SUBMITTED],
      [WorkStatus.SUBMITTED]: [WorkStatus.ACCEPTED, WorkStatus.REJECTED],
      [WorkStatus.ACCEPTED]: [WorkStatus.PUBLISHED],
      [WorkStatus.PUBLISHED]: [WorkStatus.ON_SALE],
      [WorkStatus.ON_SALE]: [],
      [WorkStatus.REJECTED]: [WorkStatus.DRAFT], // Possibilité de retravailler
    }

    if (!validTransitions[existingWork.status].includes(status)) {
      return NextResponse.json({ 
        error: `Cannot change status from ${existingWork.status} to ${status}` 
      }, { status: 400 })
    }

    // Mettre à jour le statut
    const updatedWork = await prisma.work.update({
      where: { id: params.id },
      data: { status },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        discipline: true,
      }
    })

    return NextResponse.json(updatedWork)
  } catch (error) {
    console.error("Error updating work status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}





