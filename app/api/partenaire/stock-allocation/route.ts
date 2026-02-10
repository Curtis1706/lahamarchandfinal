import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enrichPartnerStockWithAvailable } from "@/lib/partner-stock"
import { getPaginationParams } from "@/lib/pagination"
import { logger } from "@/lib/logger"

// Define the type for stock items including relations
type StockItemWithRelations = Prisma.PartnerStockGetPayload<{
  include: {
    work: {
      select: {
        id: true;
        title: true;
        isbn: true;
        price: true;
        author: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        discipline: {
          select: {
            id: true;
            name: true;
          };
        };
        project: {
          select: {
            id: true;
            title: true;
          };
        };
      };
    };
  };
}>;

export const dynamic = 'force-dynamic'

// GET /api/partenaire/stock-allocation - Stock alloué au partenaire
export async function GET(request: NextRequest) {
  try {
    logger.debug('📍 Step 1: Starting stock-allocation request')
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      logger.warn('🚫 Access denied for user:', session?.user?.id)
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    logger.debug('📍 Step 2: Getting URL params')
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''

    logger.debug('📍 Step 3: Finding user')
    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      logger.error('❌ User not found:', session.user.id)
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    logger.debug('📍 Step 4: Finding or creating partner for user:', user.name)
    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      logger.debug('📍 Step 4a: Creating partner')
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        logger.info("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    logger.debug('📍 Step 5: Getting pagination params')
    // Paramètres de pagination
    const paginationParams = getPaginationParams(searchParams)
    logger.debug('Pagination params:', paginationParams)

    logger.debug('📍 Step 6: Building where clause')
    // Construire le where clause avec les filtres
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

    logger.debug('📍 Step 7: Building query options')
    // Récupérer le stock alloué au partenaire avec pagination cursor
    const queryOptions: any = {
      where: whereClause,
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
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
      },
      take: paginationParams.take + 1
    }

    // Ajouter le curseur si présent
    if (paginationParams.cursor) {
      queryOptions.cursor = {
        id: paginationParams.cursor
      }
      queryOptions.skip = 1 // Skip the cursor itself
    }

    logger.debug('📍 Step 8: Querying database')
    const stockItems = await prisma.partnerStock.findMany(queryOptions) as unknown as StockItemWithRelations[]
    logger.debug(`✅ Found ${stockItems.length} stock items`)

    logger.debug('📍 Step 9: Calculating pagination')
    // Déterminer s'il y a plus de données
    const hasMore = stockItems.length > paginationParams.take
    const items = hasMore ? stockItems.slice(0, -1) : stockItems
    const nextCursor = hasMore ? items[items.length - 1].id : null

    logger.debug('📍 Step 10: Enriching stock with available quantity')
    // Enrichir avec availableQuantity calculé
    const enrichedStock = items.map(enrichPartnerStockWithAvailable)
    logger.debug(`✅ Enriched ${enrichedStock.length} items`)

    logger.debug('📍 Step 11: Transforming data')
    // Transformer les données pour l'affichage
    const stockData = enrichedStock.map(item => ({
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
      availableQuantity: item.availableQuantity, // Calculé
      status: item.availableQuantity > 0 ? 'Disponible' : 'Épuisé',
      price: item.work.price || 0,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))

    logger.debug('📍 Step 12: Returning response')
    return NextResponse.json({
      stockItems: stockData,
      total: stockData.length,
      pagination: {
        nextCursor: nextCursor,
        hasMore: hasMore
      }
    })

  } catch (error: any) {
    logger.error('❌ ERROR in stock-allocation API:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

