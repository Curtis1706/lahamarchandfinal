import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAvailableStock } from "@/lib/partner-stock"
import { getPaginationParams, paginateQuery } from "@/lib/pagination"

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
    const view = searchParams.get('view') || 'allocated' // 'allocated' ou 'available'

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Paramètres de pagination
    const paginationParams = getPaginationParams(searchParams, 50)

    let works: any[] = []
    let partnerStocks: any[] = []
    let paginatedResult: any = null

    if (view === 'allocated') {
      // Stock alloué au partenaire
      const whereClause: any = {
        partnerId: partner.id
      }

      paginatedResult = await paginateQuery(
        paginationParams,
        {
          where: whereClause,
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                price: true,
                stock: true,
                createdAt: true,
                publishedAt: true,
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true
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
        },
        prisma.partnerStock
      )

      partnerStocks = paginatedResult.data
      works = partnerStocks.map((ps: any) => ({ ...ps.work, partnerStock: ps }))
    } else if (view === 'available') {
      // Œuvres disponibles pour allocation
      const whereClause: any = {
        status: 'PUBLISHED',
        stock: { gt: 0 }
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

      paginatedResult = await paginateQuery(
        paginationParams,
        {
          where: whereClause,
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            stock: true,
            createdAt: true,
            publishedAt: true,
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
        },
        prisma.work
      )

      works = paginatedResult.data
    }

    // Transformer les données pour l'affichage
    const stockData = works.map((work: any) => {
      // Trouver le stock alloué pour ce partenaire si disponible
      const partnerStock = work.partnerStock || partnerStocks.find((ps: any) => ps.workId === work.id)
      
      // Calculer le stock disponible si PartnerStock existe
      const availableQuantity = partnerStock 
        ? calculateAvailableStock(
            partnerStock.allocatedQuantity,
            partnerStock.soldQuantity,
            partnerStock.returnedQuantity
          )
        : 0
      
      return {
        id: work.id,
        title: work.title,
        isbn: work.isbn || 'N/A',
        discipline: work.discipline?.name || 'Non définie',
        author: work.author?.name || 'Auteur inconnu',
        project: work.project?.title || null,
        status: partnerStock 
          ? (availableQuantity > 0 ? 'Disponible' : 'Épuisé')
          : (work.stock > 0 ? 'Disponible' : 'Rupture de stock'),
        stock: partnerStock ? availableQuantity : work.stock || 0,
        allocatedStock: partnerStock?.allocatedQuantity || 0,
        soldQuantity: partnerStock?.soldQuantity || 0,
        returnedQuantity: partnerStock?.returnedQuantity || 0,
        price: work.price || 0,
        createdAt: work.createdAt.toISOString(),
        publishedAt: work.publishedAt?.toISOString() || null
      }
    })

    return NextResponse.json({
      works: stockData,
      total: stockData.length,
      pagination: paginatedResult ? {
        nextCursor: paginatedResult.nextCursor,
        hasMore: paginatedResult.hasMore
      } : undefined
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du stock partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

