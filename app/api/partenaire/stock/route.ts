import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAvailableStock } from "@/lib/partner-stock"

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

    // Récupérer le stock alloué spécifique au partenaire via PartnerStock
    const partnerStocks = await prisma.partnerStock.findMany({
      where: {
        partnerId: partner.id
      },
      include: {
        work: {
          include: {
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
    })

    // Si le partenaire n'a pas de stock alloué, retourner les œuvres publiées
    let works: any[] = []
    
    if (partnerStocks.length > 0) {
      // Utiliser le stock alloué
      works = partnerStocks.map(ps => ps.work)
    } else {
      // Fallback : retourner les œuvres publiées
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

      works = await prisma.work.findMany({
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
    }

    // Transformer les données pour l'affichage
    const stockData = works.map(work => {
      // Trouver le stock alloué pour ce partenaire si disponible
      const partnerStock = partnerStocks.find(ps => ps.workId === work.id)
      
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

