import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/stock - Stock alloué au partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''
    const status = searchParams.get('status') || ''

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Pour l'instant, on retourne toutes les œuvres validées
    // TODO: Implémenter la logique de stock alloué spécifique au partenaire
    const whereClause: any = {
      status: 'PUBLISHED'
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (discipline) {
      whereClause.discipline = {
        name: { contains: discipline, mode: 'insensitive' }
      }
    }

    const works = await prisma.work.findMany({
      where: whereClause,
      include: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour l'affichage
    const stockData = works.map(work => ({
      id: work.id,
      title: work.title,
      isbn: work.isbn || 'N/A',
      discipline: work.discipline?.name || 'Non définie',
      author: work.author?.name || 'Auteur inconnu',
      project: work.project?.title || null,
      status: 'Disponible',
      stock: 100, // TODO: Implémenter la logique de stock réel
      price: 3000, // TODO: Récupérer le prix depuis la base
      createdAt: work.createdAt.toISOString(),
      publishedAt: work.publishedAt?.toISOString() || null
    }))

    return NextResponse.json({
      works: stockData,
      total: stockData.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du stock partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

