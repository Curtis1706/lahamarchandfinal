import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAvailableStock } from "@/lib/partner-stock"

export const dynamic = 'force-dynamic'

/**
 * GET /api/partenaire/dashboard
 * 
 * Retourne les données du dashboard partenaire :
 * - KPIs : Stock disponible, Ventes, Retours, Ristournes
 * - Activité récente (10 derniers mouvements)
 * - Stock faible
 * - Top ventes
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le partenaire
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        representant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        stockItems: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                price: true
              }
            }
          }
        },
        stockMovements: {
          where: {
            type: {
              in: ['PARTNER_SALE', 'PARTNER_RETURN', 'PARTNER_ALLOCATION']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true
              }
            }
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Dates pour les calculs
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    // Calculer le stock disponible total
    const totalAvailableStock = partner.stockItems.reduce((sum, item) => {
      const available = calculateAvailableStock(
        item.allocatedQuantity,
        item.soldQuantity,
        item.returnedQuantity
      )
      return sum + available
    }, 0)

    // Récupérer les ventes (mouvements PARTNER_SALE)
    const salesMovements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_SALE',
        createdAt: {
          gte: startOfMonth
        }
      },
      include: {
        work: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    const salesTodayMovements = salesMovements.filter(m => 
      new Date(m.createdAt) >= startOfDay
    )

    const salesMonthQty = salesMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    const salesMonthAmount = salesMovements.reduce((sum, m) => 
      sum + (m.totalAmount ?? (m.unitPrice ?? 0) * Math.abs(m.quantity)), 0
    )
    const salesTodayQty = salesTodayMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)

    // Récupérer les retours (mouvements PARTNER_RETURN)
    const returnsMovements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_RETURN',
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const returnsMonthQty = returnsMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)

    // Calculer les ristournes disponibles (si le modèle existe)
    const availableRebates = await prisma.partnerRebate.aggregate({
      where: {
        partnerId: partner.id,
        status: 'VALIDATED',
        paidAt: null
      },
      _sum: {
        amount: true
      }
    })

    const ristournesDisponibles = availableRebates._sum.amount ?? 0

    // Stock faible (availableQuantity <= 5)
    const LOW_STOCK_THRESHOLD = 5
    const lowStockItems = partner.stockItems
      .map(item => {
        const available = calculateAvailableStock(
          item.allocatedQuantity,
          item.soldQuantity,
          item.returnedQuantity
        )
        return {
          ...item,
          availableQuantity: available
        }
      })
      .filter(item => item.availableQuantity <= LOW_STOCK_THRESHOLD && item.availableQuantity > 0)
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        workId: item.workId,
        title: item.work.title,
        isbn: item.work.isbn,
        availableQuantity: item.availableQuantity,
        allocatedQuantity: item.allocatedQuantity,
        threshold: LOW_STOCK_THRESHOLD
      }))

    // Top ventes du mois (par livre)
    const topSalesMap = new Map<string, { title: string; quantity: number; amount: number }>()
    salesMovements.forEach(movement => {
      const workId = movement.workId
      const quantity = Math.abs(movement.quantity)
      const amount = movement.totalAmount ?? (movement.unitPrice ?? 0) * quantity
      
      const current = topSalesMap.get(workId) || { title: movement.work.title, quantity: 0, amount: 0 }
      current.quantity += quantity
      current.amount += amount
      topSalesMap.set(workId, current)
    })

    const topSales = Array.from(topSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Activité récente (10 derniers mouvements)
    const recentMovements = partner.stockMovements.map(m => ({
      id: m.id,
      type: m.type,
      quantity: Math.abs(m.quantity),
      createdAt: m.createdAt.toISOString(),
      work: {
        id: m.work.id,
        title: m.work.title,
        isbn: m.work.isbn
      },
      reference: m.reference,
      reason: m.reason
    }))

    // Dernière vente enregistrée
    const lastSale = await prisma.stockMovement.findFirst({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_SALE'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    return NextResponse.json({
      kpis: {
        totalAvailableStock,
        salesTodayQty,
        salesMonthQty,
        salesMonthAmount,
        returnsMonthQty,
        ristournesDisponibles,
        lowStockCount: lowStockItems.length
      },
      partner: {
        name: partner.name,
        type: partner.type,
        status: 'ACTIF', // À adapter selon votre logique
        representant: partner.representant ? {
          name: partner.representant.name,
          email: partner.representant.email,
          phone: partner.representant.phone
        } : null,
        lastSaleDate: lastSale?.createdAt.toISOString() ?? null
      },
      recentMovements,
      lowStockItems,
      topSales,
      totalWorks: partner.stockItems.length
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des données du dashboard:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
