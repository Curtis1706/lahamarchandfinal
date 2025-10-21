import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/catalogue - Catalogue des œuvres disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''
    const price = searchParams.get('price') || ''

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    const whereClause: any = {
      status: 'PUBLISHED'
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (discipline && discipline !== 'all') {
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
    let catalogueData = works.map(work => ({
      id: work.id,
      title: work.title,
      isbn: work.isbn || 'N/A',
      discipline: work.discipline?.name || 'Non définie',
      author: work.author?.name || 'Auteur inconnu',
      price: work.price || 0,
      available: work.stock > 0,
      stock: work.stock || 0,
      description: work.description || 'Description non disponible',
      coverImage: null // Images de couverture à implémenter ultérieurement
    }))

    // Filtrer par prix si nécessaire
    if (price && price !== 'all') {
      catalogueData = catalogueData.filter(work => {
        switch (price) {
          case 'low':
            return work.price < 3500
          case 'medium':
            return work.price >= 3500 && work.price < 4500
          case 'high':
            return work.price >= 4500
          default:
            return true
        }
      })
    }

    return NextResponse.json({
      works: catalogueData,
      total: catalogueData.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du catalogue partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

