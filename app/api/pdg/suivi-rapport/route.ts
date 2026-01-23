import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/suivi-rapport - Récupérer les données de suivi et rapport
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const disciplineId = searchParams.get('disciplineId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Calculer les statistiques globales
    const totalStock = await prisma.work.aggregate({
      _sum: {
        stock: true
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

    // Construire les conditions de filtre pour les œuvres
    const where: any = {}

    if (disciplineId && disciplineId !== 'tous-livres') {
      where.disciplineId = disciplineId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ]
    }

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
          stockMovements: {
            where: date ? {
              createdAt: {
                gte: new Date(date),
                lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
              }
            } : undefined,
            orderBy: {
              createdAt: 'desc'
            },
            take: 100
          },
          _count: {
            select: {
              stockMovements: true
            }
          }
        },
        orderBy: { title: 'asc' },
        take: limit,
        skip: skip
      }),
      prisma.work.count({ where })
    ])

    // Pour chaque œuvre, calculer les statistiques
    const trackingData = await Promise.all(
      works.map(async (work) => {
        // Stock actuel
        const stockActuel = work.stock

        // Stock en dépôt (chez les partenaires) - availableQuantity calculé
        const depotStocks = await prisma.partnerStock.findMany({
          where: {
            workId: work.id
          },
          select: {
            allocatedQuantity: true,
            soldQuantity: true,
            returnedQuantity: true
          }
        })
        const stockDepot = depotStocks.reduce((sum, ps) => {
          const available = ps.allocatedQuantity - ps.soldQuantity + ps.returnedQuantity
          return sum + available
        }, 0)

        // Calculer les mouvements de rentrée (INBOUND)
        const rentreeMovements = await prisma.stockMovement.aggregate({
          where: {
            workId: work.id,
            type: 'INBOUND',
            ...(date ? {
              createdAt: {
                gte: new Date(date),
                lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
              }
            } : {})
          },
          _sum: {
            quantity: true
          }
        })

        // Calculer les mouvements de vacances (sorties pour ventes, etc.)
        const vacancesMovements = await prisma.stockMovement.aggregate({
          where: {
            workId: work.id,
            type: 'OUTBOUND',
            ...(date ? {
              createdAt: {
                gte: new Date(date),
                lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
              }
            } : {})
          },
          _sum: {
            quantity: true
          }
        })

        // Récupérer le créateur (premier mouvement ou auteur)
        const firstMovement = await prisma.stockMovement.findFirst({
          where: {
            workId: work.id
          },
          include: {
            performedByUser: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        })

        return {
          id: work.id,
          livre: work.title,
          reference: work.isbn,
          rentree: Math.abs(rentreeMovements._sum.quantity || 0),
          vacances: Math.abs(vacancesMovements._sum.quantity || 0),
          depot: stockDepot,
          stockActuel: stockActuel,
          creeLe: work.createdAt ? format(work.createdAt, 'dd MMM yyyy', { locale: fr }) : '-',
          creePar: firstMovement?.performedByUser?.name || work.author?.name || 'Système',
          description: work.description || '-',
          discipline: work.discipline?.name || '-'
        }
      })
    )

    return NextResponse.json({
      stats: {
        enStock: totalStock._sum.stock || 0,
        enDepot: totalDepot, // totalDepot est maintenant un nombre calculé
        total: totalGlobal
      },
      data: trackingData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching tracking report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du rapport de suivi' },
      { status: 500 }
    )
  }
}

