import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/reports - Générer un rapport d'activité du représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Dates de début et de fin sont obligatoires' },
        { status: 400 }
      )
    }

    // Valider et parser les dates
    let start: Date
    let end: Date
    
    try {
      start = new Date(startDate)
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: 'Date de début invalide' },
          { status: 400 }
        )
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Date de début invalide' },
        { status: 400 }
      )
    }

    try {
      // Si endDate est juste "YYYY-MM", compléter avec le dernier jour du mois
      if (endDate.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = endDate.split('-').map(Number)
        end = new Date(year, month, 0) // Dernier jour du mois
      } else {
        end = new Date(endDate)
      }
      
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Date de fin invalide' },
          { status: 400 }
        )
      }
      end.setHours(23, 59, 59, 999) // Fin de journée
    } catch (e) {
      return NextResponse.json(
        { error: 'Date de fin invalide' },
        { status: 400 }
      )
    }

    // Récupérer les statistiques des auteurs gérés par ce représentant
    // Pour l'instant, les représentants ne gèrent pas directement les auteurs
    // Cette fonctionnalité sera implémentée quand la relation sera ajoutée
    const authorsStats = { _count: { id: 0 } }
    const activeAuthors = 0

    // Récupérer les statistiques des œuvres
    // Pour l'instant, les représentants ne gèrent pas directement les œuvres
    // Cette fonctionnalité sera implémentée quand la relation sera ajoutée
    const worksStats = { _count: { id: 0 } }

    const worksByStatus = []

    // Récupérer d'abord les IDs des partenaires de ce représentant
    const partnerIds = await prisma.partner.findMany({
      where: {
        representantId: session.user.id
      },
      select: {
        id: true
      }
    })

    const partnerIdsList = partnerIds.map(p => p.id)

    // Récupérer les statistiques des commandes des partenaires de ce représentant
    const ordersStats = partnerIdsList.length > 0
      ? await prisma.order.aggregate({
          where: {
            createdAt: {
              gte: start,
              lte: end
            },
            partnerId: {
              in: partnerIdsList
            }
          },
          _count: {
            id: true
          }
        })
      : { _count: { id: 0 } }

    // Calculer le montant total des commandes des partenaires
    const ordersWithItems = partnerIdsList.length > 0
      ? await prisma.order.findMany({
          where: {
            createdAt: {
              gte: start,
              lte: end
            },
            partnerId: {
              in: partnerIdsList
            }
          },
          include: {
            items: true
          }
        })
      : []

    const totalAmount = ordersWithItems.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
      return sum + orderTotal
    }, 0)

    // Ensuite, grouper les commandes par statut
    const ordersByStatus = partnerIdsList.length > 0
      ? await prisma.order.groupBy({
          by: ['status'],
          where: {
            createdAt: {
              gte: start,
              lte: end
            },
            partnerId: {
              in: partnerIdsList
            }
          },
          _count: {
            id: true
          }
        })
      : []

    // Récupérer les activités récentes
    const activities = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Transformer les données
    const worksStatusMap = {
      'DRAFT': 0,
      'PENDING': 0,
      'UNDER_REVIEW': 0,
      'PUBLISHED': 0,
      'REJECTED': 0
    }

    worksByStatus.forEach(stat => {
      worksStatusMap[stat.status as keyof typeof worksStatusMap] = stat._count.id
    })

    const ordersStatusMap = {
      'PENDING': 0,
      'VALIDATED': 0,
      'PROCESSING': 0,
      'SHIPPED': 0,
      'DELIVERED': 0,
      'CANCELLED': 0
    }

    ordersByStatus.forEach(stat => {
      ordersStatusMap[stat.status as keyof typeof ordersStatusMap] = stat._count.id
    })

    const formattedActivities = activities.map(activity => {
      // Parser metadata si c'est une chaîne JSON
      let metadata: any = null
      if (activity.metadata) {
        try {
          metadata = typeof activity.metadata === 'string' 
            ? JSON.parse(activity.metadata) 
            : activity.metadata
        } catch (e) {
          console.warn('Failed to parse metadata:', e)
          metadata = null
        }
      }

      return {
        id: activity.id,
        type: activity.action,
        description: activity.details || activity.action,
        date: activity.createdAt.toISOString(),
        author: metadata?.authorName || null,
        work: metadata?.workTitle || null,
        order: metadata?.orderTitle || null
      }
    })

    const reportData = {
      period: `${startDate} - ${endDate}`,
      authors: {
        total: activeAuthors,
        active: activeAuthors,
        new: authorsStats._count.id
      },
      works: {
        total: worksStats._count.id,
        pending: worksStatusMap.PENDING,
        transmitted: worksStatusMap.UNDER_REVIEW,
        published: worksStatusMap.PUBLISHED,
        rejected: worksStatusMap.REJECTED
      },
      orders: {
        total: ordersStats._count.id,
        pending: ordersStatusMap.PENDING,
        completed: ordersStatusMap.DELIVERED,
        totalValue: totalAmount
      },
      activities: formattedActivities
    }

    return NextResponse.json(reportData)

  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
