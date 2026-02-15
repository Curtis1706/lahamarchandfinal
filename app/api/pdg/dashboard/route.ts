import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus, WorkStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/pdg/dashboard - Récupérer les statistiques du dashboard PDG
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Statistiques générales
    const [
      totalUsers,
      totalWorks,
      totalOrders,
      totalRevenue,
      validatedOrders,
      outOfStockWorks,
      recentWorks
    ] = await Promise.all([
      // Total utilisateurs actifs
      prisma.user.count({
        where: { status: 'ACTIVE' }
      }),

      // Total œuvres publiées
      prisma.work.count({
        where: { status: WorkStatus.PUBLISHED }
      }),

      // Total commandes
      prisma.order.count(),

      // Récupérer les commandes validées/livrées pour calculer les totaux financiers
      prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        },
        include: {
          items: true
        }
      }),

      // Commandes validées aux clients (non partenaires) avec items
      prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          },
          partnerId: null
        },
        include: {
          items: true
        }
      }),

      // Ne plus charger les commandes aux partenaires (remplacé par PartnerStock)

      // Œuvres en rupture de stock
      prisma.work.findMany({
        where: {
          status: WorkStatus.PUBLISHED,
          stock: { lte: 0 }
        },
        select: {
          id: true,
          title: true,
          isbn: true,
          stock: true,
          physicalStock: true,
          files: true
        },
        orderBy: { title: 'asc' },
        take: 10
      }),

      // Œuvres récentes pour le carrousel
      prisma.work.findMany({
        where: { status: WorkStatus.PUBLISHED },
        select: {
          id: true,
          title: true,
          isbn: true,
          price: true,
          discipline: {
            select: {
              name: true
            }
          },
          files: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // Calculer le nombre de livres validés aux clients (non partenaires)
    // Récupérer d'abord les commandes validées aux clients
    const validatedClientOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        },
        partnerId: null
      },
      select: { id: true }
    })

    const validatedBooksCount = await prisma.orderItem.aggregate({
      where: {
        orderId: { in: validatedClientOrders.map(o => o.id) }
      },
      _sum: { quantity: true }
    })

    // Calculer le nombre de livres alloués aux partenaires
    const partnerBooksAllocated = await prisma.partnerStock.aggregate({
      _sum: {
        allocatedQuantity: true
      }
    })

    // Calculer les totaux à partir des items si le total de la commande n'est pas disponible
    const calculateOrderTotal = (order: any) => {
      try {
        // Prioriser le total stocké s'il existe et est valide
        if (order.total && Number(order.total) > 0) {
          return Number(order.total)
        }
        // Sinon calculer à partir des items
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          const calculatedTotal = order.items.reduce((sum: number, item: any) => {
            const itemPrice = Number(item.price || 0)
            const itemQuantity = Number(item.quantity || 0)
            return sum + (itemPrice * itemQuantity)
          }, 0)
          return calculatedTotal
        }
        return 0
      } catch (calcError: any) {
        logger.error('⚠️ Error calculating order total:', calcError.message)
        return 0
      }
    }

    // 💰 Calcul du Revenu Total (Uniquement ce qui est PAYÉ)
    // validatedOrders contient toutes les commandes validées/livrées (clients + partenaires)
    const totalRevenueAmount = Array.isArray(validatedOrders)
      ? validatedOrders.reduce((sum, order) => {
        // Si la commande est entièrement payée, on prend le total
        if (order.paymentStatus === 'PAID') {
          return sum + calculateOrderTotal(order)
        }
        // Sinon on prend le montant payé partiel (s'il existe)
        return sum + (Number(order.amountPaid) || 0)
      }, 0)
      : 0

    // ⏳ Calcul de la Dette Totale (Reste à payer sur les commandes validées)
    // Concerne principalement les dépôts
    const totalDebtAmount = Array.isArray(validatedOrders)
      ? validatedOrders.reduce((sum, order) => {
        // Si payé, pas de dette
        if (order.paymentStatus === 'PAID') return sum

        // Si dépôt ou crédit, on calcule le reste
        if (order.paymentType === 'DEPOSIT' || (order as any).paymentMethod === 'depot' || order.paymentType === 'CREDIT') {
          // Si remainingAmount est fiable
          if (order.remainingAmount !== null && order.remainingAmount !== undefined) {
            return sum + Number(order.remainingAmount)
          }
          // Sinon on calcule Total - Payé
          const total = calculateOrderTotal(order)
          const paid = Number(order.amountPaid) || 0
          return sum + Math.max(0, total - paid)
        }
        return sum
      }, 0)
      : 0

    // Calculer les montants pour les clients
    // validatedClientOrders est utilisé pour le nombre de livres, mais on a besoin des montants
    // validatedOrders contient tout, mais on veut filtrer pour clients seulement (partnerId === null)
    const validatedToClientsAmount = Array.isArray(validatedOrders)
      ? validatedOrders.reduce((sum, order) => {
        if (order.partnerId) return sum // Ignorer partenaires
        const orderTotal = calculateOrderTotal(order)
        return sum + orderTotal
      }, 0)
      : 0

    // Les livres alloués aux partenaires ne sont pas encore vendus, donc montant = 0
    const toPartnersAmount = 0

    const totalValidatedBooks = (validatedBooksCount._sum.quantity || 0) + (partnerBooksAllocated._sum.allocatedQuantity || 0)
    const totalValidatedAmount = validatedToClientsAmount + toPartnersAmount

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWorks,
        totalOrders,
        totalRevenue: totalRevenueAmount,
        totalDebt: totalDebtAmount, // Nouveau champ
        validatedToClients: {
          books: validatedBooksCount._sum.quantity || 0,
          amount: validatedToClientsAmount
        },
        toCollaborators: {
          books: partnerBooksAllocated._sum.allocatedQuantity || 0,
          amount: toPartnersAmount
        },
        totalValidated: {
          books: totalValidatedBooks,
          amount: totalValidatedAmount
        }
      },
      outOfStock: outOfStockWorks.map(work => {
        let coverImage = null;
        try {
          if (work.files) {
            const filesData = JSON.parse(work.files);
            coverImage = filesData.coverImage || null;
          }
        } catch (e) {
          console.error("Error parsing files for outOfStock work", work.id, e);
        }
        return {
          id: work.id,
          title: work.title,
          isbn: work.isbn,
          stock: work.stock,
          physicalStock: work.physicalStock,
          coverImage
        };
      }),
      recentWorks: recentWorks.map(work => {
        let coverImage = null;
        try {
          if (work.files) {
            const filesData = JSON.parse(work.files);
            coverImage = filesData.coverImage || null;
          }
        } catch (e) {
          console.error("Error parsing files for work", work.id, e);
        }

        return {
          id: work.id,
          title: work.title,
          isbn: work.isbn,
          price: work.price,
          discipline: work.discipline?.name || 'N/A',
          coverImage
        };
      }),
      user: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    })

  } catch (error: any) {
    logger.error("❌ Error fetching PDG dashboard stats:", error)
    logger.error("Error name:", error?.name)
    logger.error("Error message:", error?.message)
    logger.error("Stack trace:", error?.stack)
    if (error?.code) {
      logger.error("Error code:", error.code)
    }
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des statistiques',
        message: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
        code: process.env.NODE_ENV === 'development' ? error?.code : undefined
      },
      { status: 500 }
    )
  }
}

