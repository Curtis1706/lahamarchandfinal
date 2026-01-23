import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/reports - Rapports du partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'summary'

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Définir la période
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours par défaut
    const end = endDate ? new Date(endDate) : new Date()

    if (type === 'summary') {
      // Rapport de synthèse
      const ordersStats = await prisma.order.aggregate({
        where: {
          partnerId: partner.id,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _count: {
          id: true
        }
      })

      const completedOrders = await prisma.order.count({
        where: {
          partnerId: partner.id,
          status: 'DELIVERED',
          createdAt: {
            gte: start,
            lte: end
          }
        }
      })

      const pendingOrders = await prisma.order.count({
        where: {
          partnerId: partner.id,
          status: 'PENDING',
          createdAt: {
            gte: start,
            lte: end
          }
        }
      })

      // Calculer le chiffre d'affaires
      const ordersWithItems = await prisma.order.findMany({
        where: {
          partnerId: partner.id,
          status: 'DELIVERED',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: true
        }
      })

      const totalRevenue = ordersWithItems.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
          return itemSum + (item.price * item.quantity)
        }, 0)
      }, 0)

      // Top 5 des œuvres les plus commandées
      const topWorks = await prisma.orderItem.groupBy({
        by: ['workId'],
        where: {
          order: {
            partnerId: partner.id,
            status: 'DELIVERED',
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })

      const topWorksWithDetails = await Promise.all(
        topWorks.map(async (item) => {
          const work = await prisma.work.findUnique({
            where: { id: item.workId },
            select: {
              id: true,
              title: true,
              isbn: true,
              discipline: {
                select: {
                  name: true
                }
              },
              author: {
                select: {
                  name: true
                }
              }
            }
          })
          return {
            work,
            totalQuantity: item._sum.quantity || 0
          }
        })
      )

      return NextResponse.json({
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        summary: {
          totalOrders: ordersStats._count.id,
          completedOrders,
          pendingOrders,
          totalRevenue,
          averageOrderValue: ordersStats._count.id > 0 ? Math.round(totalRevenue / ordersStats._count.id) : 0
        },
        topWorks: topWorksWithDetails.filter(item => item.work !== null)
      })

    } else if (type === 'detailed') {
      // Rapport détaillé
      const orders = await prisma.order.findMany({
        where: {
          partnerId: partner.id,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          items: {
            include: {
              work: {
                select: {
                  id: true,
                  title: true,
                  isbn: true,
                  discipline: {
                    select: {
                      name: true
                    }
                  },
                  author: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const detailedOrders = orders.map(order => ({
        id: order.id,
        reference: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn || 'N/A',
            discipline: item.work.discipline?.name || 'Non définie',
            author: item.work.author?.name || 'Auteur inconnu'
          },
          quantity: item.quantity,
          price: item.price
        })),
        client: order.user,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }))

      return NextResponse.json({
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        orders: detailedOrders,
        total: detailedOrders.length
      })
    }

    return NextResponse.json({ error: 'Type de rapport non supporté' }, { status: 400 })

  } catch (error: any) {
    logger.error('Erreur lors de la génération du rapport partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

