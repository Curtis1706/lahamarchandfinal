import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/matieres - Récupérer les matières (disciplines)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const disciplines = await prisma.discipline.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    const formattedMatieres = disciplines.map((discipline) => ({
      id: discipline.id,
      matiere: discipline.name,
      statut: discipline.isActive ? "Disponible" : "Indisponible",
      creeLe: discipline.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: "PDG Administrateur",
      modifieLe: discipline.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return NextResponse.json(formattedMatieres)

  } catch (error) {
    logger.error("Error fetching matieres:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/matieres - Créer une matière (discipline)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { matiere, statut } = await request.json()

    const newDiscipline = await prisma.discipline.create({
      data: {
        name: matiere,
        isActive: statut === 'Disponible'
      }
    })

    // Audit log

    const formattedMatiere = {
      id: newDiscipline.id,
      matiere: newDiscipline.name,
      statut: newDiscipline.isActive ? "Disponible" : "Indisponible",
      creeLe: newDiscipline.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: "PDG Administrateur",
      modifieLe: newDiscipline.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(formattedMatiere, { status: 201 })

  } catch (error: any) {
    logger.error("Error creating matiere:", error)

    // Gérer l'erreur de contrainte unique (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: "Cette matière existe déjà dans le système"
      }, { status: 409 })
    }

    return NextResponse.json({
      error: "Erreur lors de la création de la matière",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

