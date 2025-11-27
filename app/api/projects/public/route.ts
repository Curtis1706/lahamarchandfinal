import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allowGuest } from "@/lib/auth-guard"

export const dynamic = 'force-dynamic'

// GET /api/projects/public - Récupérer les projets publics
export const GET = allowGuest(async (request: NextRequest, context) => {
  try {
    // Récupérer uniquement les projets publics (statut ACTIVE ou PUBLISHED)
    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ["ACTIVE", "PUBLISHED"]
        }
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 projets publics
    })

    return NextResponse.json({
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        discipline: project.discipline,
        createdAt: project.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error("Error fetching public projects:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
})

