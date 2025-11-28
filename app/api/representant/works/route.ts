import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/works - NON AUTORISÉ
// Le Représentant n'a pas accès aux modules Œuvres selon le cahier des charges
// (Sauf catalogue public en lecture seule si nécessaire pour la promotion)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Accès refusé. Le Représentant n\'a pas accès aux modules Œuvres internes.' 
  }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const disciplineId = searchParams.get('disciplineId')

    // Construire les filtres
    // Pour l'instant, les représentants ne gèrent pas directement les œuvres
    // Cette fonctionnalité sera implémentée quand la relation sera ajoutée
    const where: any = {
      id: 'never-match' // Retourner aucune œuvre pour l'instant
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
