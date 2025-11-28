import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/dashboard - Statistiques du dashboard partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true,
        representant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!partner) {
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
          },
          include: {
            user: true,
            representant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
        console.log("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        console.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    // Statistiques des commandes
    const ordersStats = await prisma.order.aggregate({
      where: {
        partnerId: partner.id
      },
      _count: {
        id: true
      }
    })

    const pendingOrders = await prisma.order.count({
      where: {
        partnerId: partner.id,
        status: 'PENDING'
      }
    })

    const completedOrders = await prisma.order.count({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED'
      }
    })

    // Calculer le chiffre d'affaires total
    const ordersWithItems = await prisma.order.findMany({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED'
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

    // Nombre d'œuvres disponibles (toutes les œuvres validées)
    const availableWorks = await prisma.work.count({
      where: {
        status: 'PUBLISHED'
      }
    })

    // Calculer l'évolution du chiffre d'affaires (mois actuel vs mois précédent)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Chiffre d'affaires du mois actuel
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED',
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      include: {
        items: true
      }
    })

    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    // Chiffre d'affaires du mois précédent
    const previousMonthOrders = await prisma.order.findMany({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED',
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      },
      include: {
        items: true
      }
    })

    const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    // Calculer le pourcentage d'évolution
    let revenueGrowth = 0
    if (previousMonthRevenue > 0) {
      revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100 // Si pas de revenu le mois précédent mais qu'il y en a ce mois
    }

    // Récupérer les commandes récentes (5 dernières)
    const recentOrders = await prisma.order.findMany({
      where: {
        partnerId: partner.id
      },
      include: {
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Formater les commandes récentes
    const formattedRecentOrders = recentOrders.map(order => {
      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
      const disciplines = [...new Set(order.items.map(item => item.work.discipline?.name || 'Autre'))]
      
      return {
        id: order.id,
        reference: `CMD-${order.id.slice(-8)}`,
        quantity: totalQuantity,
        disciplines: disciplines.join(', '),
        status: order.status,
        amount: totalAmount,
        createdAt: order.createdAt
      }
    })

    // Récupérer la dernière activité (dernière commande)
    const lastActivity = recentOrders.length > 0 ? recentOrders[0].createdAt : partner.createdAt

    const stats = {
      totalOrders: ordersStats._count.id,
      pendingOrders,
      completedOrders,
      totalRevenue,
      availableWorks,
      revenueGrowth: Math.round(revenueGrowth),
      partner: {
        name: partner.name,
        type: partner.type,
        status: user.status,
        representant: partner.representant?.name || null,
        lastActivity: lastActivity.toISOString()
      },
      recentOrders: formattedRecentOrders
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

