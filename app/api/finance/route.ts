import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/finance - Récupérer les données financières
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux données financières
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    switch (type) {
      case 'overview':
        // Vue d'ensemble financière
        return await loadOverviewData()

      case 'sales':
        // Statistiques de ventes
        return await loadSalesData(startDate || undefined, endDate || undefined)

      case 'royalties':
        // Statistiques de royalties
        return await loadRoyaltiesData(startDate || undefined, endDate || undefined)

      case 'partner_performance':
        // Performance des partenaires
        return await loadPartnerPerformanceData(startDate || undefined, endDate || undefined)

      default:
        return NextResponse.json({ error: "Type de données non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des données financières:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Fonction pour charger les données de vue d'ensemble
async function loadOverviewData() {
  try {
    // Calculer les dates si non fournies
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Récupérer le chiffre d'affaires total (somme des ventes + commandes livrées)
    const totalSalesFromSales = await prisma.sale.aggregate({
      _sum: {
        amount: true
      }
    })

    // Calculer le chiffre d'affaires des commandes livrées
    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      include: {
        items: true
      }
    })

    const totalSalesFromOrders = deliveredOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    const totalSales = (totalSalesFromSales._sum.amount || 0) + totalSalesFromOrders

    // Récupérer le nombre total de commandes
    const totalOrders = await prisma.order.count()

    // Récupérer le nombre total d'œuvres
    const totalWorks = await prisma.work.count()

    // Récupérer le nombre total de partenaires
    const totalPartners = await prisma.user.count({
      where: { role: 'PARTENAIRE' }
    })

    // Calculer la valeur moyenne des commandes
    const ordersWithTotal = await prisma.order.findMany({
      include: {
        items: true
      }
    })

    const totalOrderValue = ordersWithTotal.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
      return sum + orderTotal
    }, 0)

    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0

    // Récupérer les commandes récentes
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: {
          include: {
            work: {
              include: {
                discipline: true
              }
            }
          }
        }
      }
    })

    // Récupérer les œuvres les plus vendues (ventes + commandes livrées)
    const salesData = await prisma.sale.groupBy({
      by: ['workId'],
      _sum: {
        quantity: true,
        amount: true
      },
      _count: {
        workId: true
      }
    })

    // Calculer les ventes des commandes livrées
    const orderSalesData: { [workId: string]: { quantity: number, revenue: number, orderCount: number } } = {}
    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        const workId = item.workId
        if (!orderSalesData[workId]) {
          orderSalesData[workId] = { quantity: 0, revenue: 0, orderCount: 0 }
        }
        orderSalesData[workId].quantity += item.quantity
        orderSalesData[workId].revenue += item.price * item.quantity
        orderSalesData[workId].orderCount += 1
      })
    })

    // Combiner les données de ventes et commandes
    const combinedSalesData: { [workId: string]: { quantity: number, revenue: number, orderCount: number } } = {}
    
    // Ajouter les ventes
    salesData.forEach(sale => {
      combinedSalesData[sale.workId] = {
        quantity: sale._sum.quantity || 0,
        revenue: sale._sum.amount || 0,
        orderCount: sale._count.workId || 0
      }
    })

    // Ajouter les commandes livrées
    Object.entries(orderSalesData).forEach(([workId, data]) => {
      if (combinedSalesData[workId]) {
        combinedSalesData[workId].quantity += data.quantity
        combinedSalesData[workId].revenue += data.revenue
        combinedSalesData[workId].orderCount += data.orderCount
      } else {
        combinedSalesData[workId] = data
      }
    })

    // Trier par revenus et prendre le top 5
    const sortedWorks = Object.entries(combinedSalesData)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5)

    const topWorks = await Promise.all(
      sortedWorks.map(async ([workId, data]) => {
        const work = await prisma.work.findUnique({
          where: { id: workId },
          include: {
            discipline: true,
            author: true
          }
        })
        return {
          work,
          totalSold: data.quantity,
          totalRevenue: data.revenue,
          orderCount: data.orderCount
        }
      })
    )

    // Générer les tendances mensuelles (derniers 6 mois)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthSales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      monthlyTrends.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthSales._sum.amount || 0,
        orders: await prisma.order.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
      })
    }

    // Revenus par discipline
    const disciplineRevenue: Record<string, number> = {}
    const salesByDiscipline = await prisma.sale.findMany({
      include: {
        work: {
          include: {
            discipline: true
          }
        }
      }
    })

    salesByDiscipline.forEach(sale => {
      const disciplineName = sale.work?.discipline?.name || 'Non définie'
      if (!disciplineRevenue[disciplineName]) {
        disciplineRevenue[disciplineName] = 0
      }
      disciplineRevenue[disciplineName] += sale?.amount || 0
    })

    const overview = {
      totalRevenue: totalSales || 0,
      totalOrders,
      totalWorks,
      totalPartners,
      avgOrderValue: Math.round(avgOrderValue),
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        customerName: order.user?.name || 'Client inconnu'
      })),
      topWorks: topWorks.filter(item => item.work !== null),
      monthlyTrends,
      disciplineRevenue
    }

    return NextResponse.json(overview)

  } catch (error) {
    console.error("Erreur lors du chargement des données de vue d'ensemble:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des données" },
      { status: 500 }
    )
  }
}

// Fonction pour charger les données de ventes
async function loadSalesData(startDate?: string, endDate?: string) {
  try {
    // Construire les filtres de date
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Récupérer les commandes (toutes les commandes, pas seulement celles dans la période)
    const orders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        user: true,
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Récupérer aussi les ventes directes pour la période
    const sales = await prisma.sale.findMany({
      where: dateFilter,
      include: {
        work: {
          include: {
            discipline: true,
            author: true
          }
        }
      }
    })

    // Calculer les statistiques (commandes + ventes directes)
    const ordersRevenue = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    const salesRevenue = sales.reduce((sum, sale) => {
      return sum + sale.amount
    }, 0)

    const totalRevenue = ordersRevenue + salesRevenue

    const ordersItems = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    const salesItems = sales.reduce((sum, sale) => {
      return sum + sale.quantity
    }, 0)

    const totalItems = ordersItems + salesItems

    const avgOrderValue = orders.length > 0 ? ordersRevenue / orders.length : 0

    // Ventes par discipline
    const salesByDiscipline: { [key: string]: number } = {}
    
    // Ajouter les commandes
    orders.forEach(order => {
      order.items.forEach(item => {
        const disciplineName = item.work?.discipline?.name || 'Non définie'
        if (!salesByDiscipline[disciplineName]) {
          salesByDiscipline[disciplineName] = 0
        }
        salesByDiscipline[disciplineName] += item.price * item.quantity
      })
    })

    // Ajouter les ventes directes
    sales.forEach(sale => {
      const disciplineName = sale.work?.discipline?.name || 'Non définie'
      if (!salesByDiscipline[disciplineName]) {
        salesByDiscipline[disciplineName] = 0
      }
      salesByDiscipline[disciplineName] += sale.amount
    })

    // Œuvres les plus vendues
    const workSales: { [key: string]: { work: any, quantity: number, revenue: number } } = {}
    
    // Ajouter les commandes
    orders.forEach(order => {
      order.items.forEach(item => {
        const workId = item.workId
        if (!workSales[workId]) {
          workSales[workId] = {
            work: item.work,
            quantity: 0,
            revenue: 0
          }
        }
        workSales[workId].quantity += item.quantity
        workSales[workId].revenue += item.price * item.quantity
      })
    })

    // Ajouter les ventes directes
    sales.forEach(sale => {
      const workId = sale.workId
      if (!workSales[workId]) {
        workSales[workId] = {
          work: sale.work,
          quantity: 0,
          revenue: 0
        }
      }
      workSales[workId].quantity += sale.quantity
      workSales[workId].revenue += sale.amount
    })

    const topSellingWorks = Object.values(workSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const salesReport = {
      summary: {
        totalRevenue,
        totalOrders: orders.length,
        totalItems,
        avgOrderValue: Math.round(avgOrderValue)
      },
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        customerName: order.user?.name || 'Client inconnu',
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work?.id,
            title: item.work?.title,
            discipline: item.work?.discipline?.name,
            author: item.work?.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        }))
      })),
      salesByDiscipline: Object.entries(salesByDiscipline).map(([discipline, revenue]) => ({
        discipline,
        revenue
      })),
      topSellingWorks
    }

    return NextResponse.json(salesReport)

  } catch (error) {
    console.error("Erreur lors du chargement des données de ventes:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des données de ventes" },
      { status: 500 }
    )
  }
}

// Fonction pour charger les données de royalties
async function loadRoyaltiesData(startDate?: string, endDate?: string) {
  try {
    // Construire les filtres de date
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Récupérer toutes les royalties
    const royalties = await prisma.royalty.findMany({
      where: dateFilter,
      include: {
        work: {
          include: {
            discipline: true
          }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalRoyalties = royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
    const pendingPayments = royalties.filter(r => !r.paid)
    const totalPendingAmount = pendingPayments.reduce((sum, royalty) => sum + royalty.amount, 0)

    // Royalties par auteur
    const royaltiesByAuthor: { [key: string]: { author: any, total: number, paid: number, pending: number } } = {}
    royalties.forEach(royalty => {
      const authorId = royalty.userId
      if (!royaltiesByAuthor[authorId]) {
        royaltiesByAuthor[authorId] = {
          author: royalty.user,
          total: 0,
          paid: 0,
          pending: 0
        }
      }
      royaltiesByAuthor[authorId].total += royalty.amount
      if (royalty.paid) {
        royaltiesByAuthor[authorId].paid += royalty.amount
      } else {
        royaltiesByAuthor[authorId].pending += royalty.amount
      }
    })

    const royaltiesData = {
      totalRoyalties,
      totalPendingAmount,
      recentRoyalties: royalties.slice(0, 10).map(royalty => ({
        id: royalty.id,
        amount: royalty.amount,
        paid: royalty.paid,
        createdAt: royalty.createdAt,
        work: {
          id: royalty.work?.id,
          title: royalty.work?.title,
          discipline: royalty.work?.discipline?.name
        },
        author: {
          id: royalty.user?.id,
          name: royalty.user?.name
        }
      })),
      royaltiesByAuthor: Object.values(royaltiesByAuthor),
      pendingPayments: pendingPayments.map(royalty => ({
        id: royalty.id,
        amount: royalty.amount,
        createdAt: royalty.createdAt,
        work: {
          id: royalty.work?.id,
          title: royalty.work?.title
        },
        author: {
          id: royalty.user?.id,
          name: royalty.user?.name
        }
      }))
    }

    return NextResponse.json(royaltiesData)

  } catch (error) {
    console.error("Erreur lors du chargement des données de royalties:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des données de royalties" },
      { status: 500 }
    )
  }
}

// Fonction pour charger les données de performance des partenaires
async function loadPartnerPerformanceData(startDate?: string, endDate?: string) {
  try {
    // Récupérer tous les partenaires
    const partners = await prisma.user.findMany({
      where: { role: 'PARTENAIRE' },
      include: {
        partner: {
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    work: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Construire les filtres de date
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const partnerPerformance = await Promise.all(
      partners.map(async (partner) => {
        // Calculer les statistiques pour ce partenaire
        const partnerOrders = partner.partner?.orders || []
        const filteredOrders = dateFilter.createdAt 
          ? partnerOrders.filter(order => 
              order.createdAt >= dateFilter.createdAt.gte && 
              order.createdAt <= dateFilter.createdAt.lte
            )
          : partnerOrders

        const totalOrders = filteredOrders.length
        const totalRevenue = filteredOrders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => {
            return itemSum + (item.price * item.quantity)
          }, 0)
        }, 0)

        const totalItems = filteredOrders.reduce((sum, order) => {
          return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
        }, 0)

        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        return {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          status: partner.status,
          totalOrders,
          totalRevenue,
          totalItems,
          avgOrderValue,
          userStatus: partner.status
        }
      })
    )

    const activePartners = partnerPerformance.filter(p => p.status === 'ACTIVE').length
    const totalRevenue = partnerPerformance.reduce((sum, p) => sum + p.totalRevenue, 0)

    const response = {
      partners: partnerPerformance,
      totalPartners: partners.length,
      activePartners,
      totalRevenue
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Erreur lors du chargement des données de performance des partenaires:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des données des partenaires" },
      { status: 500 }
    )
  }
}
