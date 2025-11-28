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

    console.log("👑 Fetching PDG dashboard stats:", session.user.name)

    // Statistiques générales
    const [
      totalUsers,
      totalWorks,
      totalOrders,
      totalRevenue,
      validatedOrders,
      collaboratorOrders,
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
      
      // Chiffre d'affaires total (commandes validées/livrées)
      prisma.order.aggregate({
        where: {
          status: { 
            in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] 
          }
        },
        _sum: { total: true }
      }),

      // Commandes validées aux clients (non partenaires)
      prisma.order.aggregate({
        where: {
          status: { 
            in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] 
          },
          partnerId: null
        },
        _sum: { total: true },
        _count: { id: true }
      }),

      // Commandes aux collaborateurs (partenaires)
      prisma.order.aggregate({
        where: {
          status: { 
            in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] 
          },
          partnerId: { not: null }
        },
        _sum: { total: true },
        _count: { id: true }
      }),

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
          physicalStock: true
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
          }
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

    // Calculer le nombre de livres validés aux collaborateurs (partenaires)
    const validatedPartnerOrders = await prisma.order.findMany({
      where: {
        status: { 
          in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] 
        },
        partnerId: { not: null }
      },
      select: { id: true }
    })

    const collaboratorBooksCount = await prisma.orderItem.aggregate({
      where: {
        orderId: { in: validatedPartnerOrders.map(o => o.id) }
      },
      _sum: { quantity: true }
    })

    const totalValidatedBooks = (validatedBooksCount._sum.quantity || 0) + (collaboratorBooksCount._sum.quantity || 0)
    const totalValidatedAmount = (validatedOrders._sum.total || 0) + (collaboratorOrders._sum.total || 0)

    return NextResponse.json({
      stats: {
        totalUsers,
        totalWorks,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        validatedToClients: {
          books: validatedBooksCount._sum.quantity || 0,
          amount: validatedOrders._sum.total || 0
        },
        toCollaborators: {
          books: collaboratorBooksCount._sum.quantity || 0,
          amount: collaboratorOrders._sum.total || 0
        },
        totalValidated: {
          books: totalValidatedBooks,
          amount: totalValidatedAmount
        }
      },
      outOfStock: outOfStockWorks,
      recentWorks: recentWorks.map(work => ({
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        discipline: work.discipline.name
      })),
      user: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching PDG dashboard stats:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

