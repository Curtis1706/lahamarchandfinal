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

    // Fonction pour calculer le total d'une commande
    const calculateOrderTotal = (order: any) => {
      // Utiliser le champ total de la commande s'il existe et est valide
      if (order.total && Number(order.total) > 0) {
        return Number(order.total)
      }
      // Sinon calculer à partir des items
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        return order.items.reduce((sum: number, item: any) => {
          const itemPrice = Number(item.price || 0)
          const itemQuantity = Number(item.quantity || 0)
          return sum + (itemPrice * itemQuantity)
        }, 0)
      }
      return 0
    }

    const totalSalesFromOrders = deliveredOrders.reduce((sum, order) => {
      return sum + calculateOrderTotal(order)
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
      return sum + calculateOrderTotal(order)
    }, 0)

    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0

    // Calculer le nombre total d'articles vendus (somme des quantités de tous les items)
    const totalItemsSold = ordersWithTotal.reduce((sum, order) => {
      return sum + (order.items?.reduce((itemSum: number, item: any) => {
        return itemSum + Number(item.quantity || 0)
      }, 0) || 0)
    }, 0)

    // Récupérer les commandes récentes avec tous les détails
    // Inclure toutes les commandes, même celles sans items pour l'instant
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
    
    console.log(`📊 Récupération de ${recentOrders.length} commandes récentes`)
    recentOrders.forEach(order => {
      console.log(`  - Commande ${order.id}: ${order.items?.length || 0} items, user: ${order.user?.name || 'N/A'}, partner: ${order.partner?.name || 'N/A'}`)
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
      totalItemsSold,
      avgOrderValue: Math.round(avgOrderValue),
      recentOrders: recentOrders.map(order => {
        // Calculer le total de la commande en utilisant la fonction helper
        const calculatedTotal = calculateOrderTotal(order)
        
        // Calculer le nombre total d'articles (somme des quantités)
        const totalItemCount = order.items && Array.isArray(order.items) && order.items.length > 0
          ? order.items.reduce((sum: number, item: any) => {
              const quantity = Number(item.quantity || 0)
              return sum + quantity
            }, 0)
          : 0
        
        // Déterminer le nom du client (utilisateur ou partenaire)
        const customerName = order.user?.name || order.partner?.name || 'N/A'
        
        return {
          id: order.id,
          status: order.status,
          total: calculatedTotal,
          itemCount: totalItemCount,
          createdAt: order.createdAt,
          customerName,
          userId: order.userId,
          partnerId: order.partnerId || null
        }
      }),
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

    // Récupérer les commandes avec tous les détails
    const orders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    // Fonction pour calculer le total d'une commande
    const calculateOrderTotal = (order: any) => {
      // Utiliser le champ total de la commande s'il existe et est valide
      if (order.total && Number(order.total) > 0) {
        return Number(order.total)
      }
      // Sinon calculer à partir des items
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        return order.items.reduce((sum: number, item: any) => {
          const itemPrice = Number(item.price || 0)
          const itemQuantity = Number(item.quantity || 0)
          return sum + (itemPrice * itemQuantity)
        }, 0)
      }
      return 0
    }

    // Calculer les statistiques (commandes + ventes directes)
    const ordersRevenue = orders.reduce((sum, order) => {
      return sum + calculateOrderTotal(order)
    }, 0)

    const salesRevenue = sales.reduce((sum, sale) => {
      return sum + (Number(sale.amount) || 0)
    }, 0)

    const totalRevenue = ordersRevenue + salesRevenue

    const ordersItems = orders.reduce((sum, order) => {
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        return sum + order.items.reduce((itemSum: number, item: any) => {
          return itemSum + Number(item.quantity || 0)
        }, 0)
      }
      return sum
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
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
          const disciplineName = item.work?.discipline?.name || 'Non définie'
          if (!salesByDiscipline[disciplineName]) {
            salesByDiscipline[disciplineName] = 0
          }
          const itemPrice = Number(item.price || 0)
          const itemQuantity = Number(item.quantity || 0)
          salesByDiscipline[disciplineName] += itemPrice * itemQuantity
        })
      }
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
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
          const workId = item.workId
          if (!workSales[workId]) {
            workSales[workId] = {
              work: item.work,
              quantity: 0,
              revenue: 0
            }
          }
          const itemPrice = Number(item.price || 0)
          const itemQuantity = Number(item.quantity || 0)
          workSales[workId].quantity += itemQuantity
          workSales[workId].revenue += itemPrice * itemQuantity
        })
      }
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
      orders: orders.map(order => {
        // Calculer le total de la commande (utiliser order.total si disponible, sinon calculer)
        const orderTotal = order.total && Number(order.total) > 0
          ? Number(order.total)
          : (order.items && Array.isArray(order.items) && order.items.length > 0
              ? order.items.reduce((sum: number, item: any) => {
                  return sum + (Number(item.price || 0) * Number(item.quantity || 0))
                }, 0)
              : 0)
        
        // Calculer le nombre total d'articles (somme des quantités)
        const totalItemCount = order.items && Array.isArray(order.items) && order.items.length > 0
          ? order.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)
          : 0
        
        // Déterminer le nom du client (utilisateur ou partenaire)
        const customerName = order.user?.name || order.partner?.name || 'Client inconnu'
        
        return {
          id: order.id,
          status: order.status,
          total: orderTotal,
          itemCount: totalItemCount,
          itemsCount: totalItemCount, // Alias pour compatibilité
          createdAt: order.createdAt,
          customerName,
          user: order.user ? {
            id: order.user.id,
            name: order.user.name || 'N/A',
            email: order.user.email || 'N/A'
          } : null,
          partner: order.partner ? {
            id: order.partner.id,
            name: order.partner.name || 'N/A',
            email: order.partner.email || 'N/A'
          } : null,
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
        }
      }),
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

    // Récupérer toutes les royalties avec leurs relations
    const royalties = await prisma.royalty.findMany({
      where: dateFilter,
      include: {
        work: {
          include: {
            discipline: true,
            author: true,
            concepteur: true
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
      recentRoyalties: royalties.slice(0, 10).map(royalty => {
        // Gérer les cas où work ou user pourraient être null
        const work = royalty.work;
        const user = royalty.user;
        
        return {
          id: royalty.id,
          amount: royalty.amount,
          paid: royalty.paid,
          createdAt: royalty.createdAt,
          work: work ? {
            id: work.id,
            title: work.title || 'N/A',
            discipline: work.discipline ? {
              name: work.discipline.name
            } : null,
            author: work.author ? {
              name: work.author.name
            } : null,
            concepteur: work.concepteur ? {
              name: work.concepteur.name
            } : null
          } : null,
          user: user ? {
            id: user.id,
            name: user.name || 'N/A',
            email: user.email || 'N/A'
          } : null
        };
      }),
      royaltiesByAuthor: Object.values(royaltiesByAuthor),
      pendingPayments: pendingPayments.map(royalty => {
        const work = royalty.work;
        const user = royalty.user;
        
        return {
          id: royalty.id,
          amount: royalty.amount,
          createdAt: royalty.createdAt,
          work: work ? {
            id: work.id,
            title: work.title || 'N/A'
          } : null,
          author: user ? {
            id: user.id,
            name: user.name || 'N/A'
          } : null
        };
      })
    }

    return NextResponse.json(royaltiesData)

  } catch (error) {
    console.error("Erreur lors du chargement des données de royalties:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: "Erreur lors du chargement des données de royalties",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Fonction pour charger les données de performance des partenaires
async function loadPartnerPerformanceData(startDate?: string, endDate?: string) {
  try {
    // Construire les filtres pour les commandes
    // Inclure toutes les commandes avec partenaire qui sont soit validées/livrées, soit payées (même si PENDING)
    const orderWhere: any = {
      partnerId: { not: null }, // Seulement les commandes avec un partenaire
      OR: [
        // Commandes validées/livrées
        {
          status: {
            in: ['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          }
        },
        // Commandes payées mais pas encore validées (ont une référence de paiement)
        {
          status: 'PENDING',
          paymentReference: { not: null }
        }
      ]
    }
    
    // Filtrer par date seulement si les deux dates sont fournies
    if (startDate && endDate) {
      // Ajouter un jour à la date de fin pour inclure toute la journée
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999)
      
      orderWhere.createdAt = {
        gte: new Date(startDate),
        lte: endDateObj
      }
    }

    // Récupérer toutes les commandes de partenaires avec leurs items
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            user: {
              select: {
                id: true,
                status: true
              }
            }
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        }
      }
    })


    // Récupérer tous les partenaires pour s'assurer qu'ils apparaissent même sans commandes
    const allPartners = await prisma.partner.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Grouper les commandes par partenaire
    const ordersByPartner = orders.reduce((acc, order) => {
      if (!order.partnerId || !order.partner) return acc
      
      const partnerId = order.partnerId
      if (!acc[partnerId]) {
        acc[partnerId] = []
      }
      acc[partnerId].push(order)
      return acc
    }, {} as Record<string, typeof orders>)

    // Calculer les statistiques pour chaque partenaire
    const partnerPerformance = allPartners.map((partner) => {
      const partnerOrders = ordersByPartner[partner.id] || []
      
      const totalOrders = partnerOrders.length
      
      // Calculer le revenu total (utiliser order.total si disponible, sinon calculer depuis items)
      const totalRevenue = partnerOrders.reduce((sum, order) => {
        if (order.total && order.total > 0) {
          return sum + Number(order.total)
        }
        // Calculer à partir des items si total n'est pas disponible
        const calculatedTotal = order.items.reduce((itemSum, item) => {
          return itemSum + (Number(item.price) * Number(item.quantity))
        }, 0)
        return sum + calculatedTotal
      }, 0)

      const totalItems = partnerOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0)
      }, 0)

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0


      return {
        partnerId: partner.id,
        partnerName: partner.name || 'N/A',
        partnerType: partner.type || 'N/A',
        ordersCount: totalOrders,
        totalRevenue: totalRevenue,
        totalItems: totalItems,
        avgOrderValue: avgOrderValue,
        userStatus: partner.user?.status || 'UNKNOWN'
      }
    })

    const activePartners = partnerPerformance.filter(p => p.userStatus === 'ACTIVE').length
    const totalRevenue = partnerPerformance.reduce((sum, p) => sum + p.totalRevenue, 0)


    const response = {
      partners: partnerPerformance,
      totalPartners: allPartners.length,
      activePartners,
      totalRevenue
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("❌ Erreur lors du chargement des données de performance des partenaires:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { 
        error: "Erreur lors du chargement des données des partenaires",
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
