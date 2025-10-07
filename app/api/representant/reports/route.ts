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

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // Fin de journée

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

    // Récupérer les statistiques des commandes des partenaires de ce représentant
    const ordersStats = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        partner: {
          representantId: session.user.id
        }
      },
      _count: {
        id: true
      }
    })

    // Calculer le montant total des commandes des partenaires
    const ordersWithItems = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        partner: {
          representantId: session.user.id
        }
      },
      include: {
        items: true
      }
    })

    const totalAmount = ordersWithItems.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        partner: {
          representantId: session.user.id
        }
      },
      _count: {
        id: true
      }
    })

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
      'CONFIRMED': 0,
      'IN_PROGRESS': 0,
      'DELIVERED': 0,
      'CANCELLED': 0
    }

    ordersByStatus.forEach(stat => {
      ordersStatusMap[stat.status as keyof typeof ordersStatusMap] = stat._count.id
    })

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.action,
      description: activity.details,
      date: activity.createdAt.toISOString(),
      author: activity.metadata?.authorName || null,
      work: activity.metadata?.workTitle || null,
      order: activity.metadata?.orderTitle || null
    }))

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
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
