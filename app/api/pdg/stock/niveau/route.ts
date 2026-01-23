import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/niveau - Récupérer les niveaux de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'title'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const disciplineId = searchParams.get('disciplineId')
    const statusFilter = searchParams.get('status')
    const stockLevel = searchParams.get('stockLevel') // 'low', 'normal', 'high', 'all'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {}

    if (disciplineId && disciplineId !== 'toutes') {
      where.disciplineId = disciplineId
    }

    if (statusFilter && statusFilter !== 'tous') {
      where.status = statusFilter
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtrer par niveau de stock
    if (stockLevel && stockLevel !== 'all') {
      if (stockLevel === 'low') {
        where.stock = {
          lt: prisma.work.fields.minStock
        }
      } else if (stockLevel === 'normal') {
        where.AND = [
          { stock: { gte: prisma.work.fields.minStock } },
          { stock: { lte: prisma.work.fields.maxStock } }
        ]
      } else if (stockLevel === 'high') {
        where.stock = {
          gt: prisma.work.fields.maxStock
        }
      }
    }

    // Construire l'ordre de tri
    const orderBy: any = {}
    if (sortBy === 'quantity') {
      orderBy.stock = sortOrder
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else if (sortBy === 'isbn') {
      orderBy.isbn = sortOrder
    } else {
      orderBy.title = 'asc'
    }

    // Calculer les statistiques globales
    const totalStock = await prisma.work.aggregate({
      _sum: {
        stock: true
      },
      where: {
        ...where,
        stock: {
          gte: 0
        }
      }
    })

    // Calculer le stock en dépôt (availableQuantity calculé)
    const partnerStocks = await prisma.partnerStock.findMany({
      select: {
        allocatedQuantity: true,
        soldQuantity: true,
        returnedQuantity: true
      }
    })
    const totalDepot = partnerStocks.reduce((sum, ps) => {
      const available = ps.allocatedQuantity - ps.soldQuantity + ps.returnedQuantity
      return sum + available
    }, 0)

    const totalGlobal = (totalStock._sum.stock || 0) + totalDepot

    // Récupérer les œuvres avec leurs stocks
    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
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
              name: true
            }
          },
          partnerStocks: {
            select: {
              availableQuantity: true,
              partner: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy,
        take: limit,
        skip: skip
      }),
      prisma.work.count({ where })
    ])

    // Calculer le stock en dépôt pour chaque œuvre
    const stockLevels = works.map(work => {
      const depotStock = work.partnerStocks.reduce((sum, ps) => sum + ps.availableQuantity, 0)
      const stockActuel = work.stock
      const totalStock = stockActuel + depotStock
      
      // Déterminer le niveau d'alerte
      let alertLevel = 'normal'
      if (stockActuel < work.minStock) {
        alertLevel = 'low'
      } else if (work.maxStock && stockActuel > work.maxStock) {
        alertLevel = 'high'
      }

      return {
        id: work.id,
        livre: work.title,
        reference: work.isbn,
        discipline: work.discipline?.name || '-',
        auteur: work.author?.name || '-',
        stockActuel: stockActuel,
        stockDepot: depotStock,
        totalStock: totalStock,
        stockMin: work.minStock,
        stockMax: work.maxStock || null,
        alertLevel: alertLevel,
        statut: work.status,
        prix: work.price,
        dernierMouvement: null, // À calculer depuis StockMovement si nécessaire
        creeLe: format(work.createdAt, 'dd MMM yyyy', { locale: fr }),
        partenaires: work.partnerStocks.map(ps => ({
          nom: ps.partner.name,
          quantite: ps.availableQuantity
        }))
      }
    })

    return NextResponse.json({
      stats: {
        enStock: totalStock._sum.stock || 0,
        enDepot: totalDepot._sum.availableQuantity || 0,
        total: totalGlobal
      },
      stockLevels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching stock levels:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des niveaux de stock' },
      { status: 500 }
    )
  }
}

