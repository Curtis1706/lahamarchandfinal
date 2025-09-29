import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/stock-allocation - Stock alloué au partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Récupérer le stock alloué au partenaire
    const whereClause: any = {
      partnerId: partner.id
    }

    if (search) {
      whereClause.work = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (discipline) {
      whereClause.work = {
        ...whereClause.work,
        discipline: {
          name: { contains: discipline, mode: 'insensitive' }
        }
      }
    }

    const stockItems = await prisma.partnerStock.findMany({
      where: whereClause,
      include: {
        work: {
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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour l'affichage
    const stockData = stockItems.map(item => ({
      id: item.id,
      workId: item.work.id,
      title: item.work.title,
      isbn: item.work.isbn || 'N/A',
      discipline: item.work.discipline?.name || 'Non définie',
      author: item.work.author?.name || 'Auteur inconnu',
      project: item.work.project?.title || null,
      allocatedQuantity: item.allocatedQuantity,
      soldQuantity: item.soldQuantity,
      returnedQuantity: item.returnedQuantity,
      availableQuantity: item.availableQuantity,
      status: item.availableQuantity > 0 ? 'Disponible' : 'Épuisé',
      price: 3000, // TODO: Récupérer le prix depuis la base
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))

    return NextResponse.json({
      stockItems: stockData,
      total: stockData.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du stock alloué:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

