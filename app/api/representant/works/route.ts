import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/works - Récupérer les œuvres des auteurs gérés par le représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const disciplineId = searchParams.get('disciplineId')

    // Construire les filtres
    const where: any = {
      // TODO: Filtrer par les auteurs gérés par ce représentant
      // author: {
      //   representantId: session.user.id
      // }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (disciplineId && disciplineId !== 'all') {
      where.disciplineId = disciplineId
    }

    const works = await prisma.work.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        files: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json(works)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des œuvres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
