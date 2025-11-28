import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/pdg/ristournes/check-orders - Vérifier les commandes validées et leurs droits d'auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer toutes les commandes validées/livrées
    const validatedOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        }
      },
      include: {
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                authorId: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        partner: {
          select: {
            id: true,
            name: true
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

    const analysis = validatedOrders.map(order => {
      const itemsWithAuthors = order.items.filter(item => item.work.authorId)
      const itemsWithoutAuthors = order.items.filter(item => !item.work.authorId)
      
      // Vérifier les royalties existantes pour cette commande
      const royaltiesForOrder = order.items
        .filter(item => item.work.authorId)
        .map(item => ({
          workId: item.work.id,
          workTitle: item.work.title,
          authorId: item.work.authorId,
          authorName: item.work.author?.name || 'Auteur inconnu',
          hasRoyalty: false
        }))

      return {
        orderId: order.id,
        orderReference: `CMD-${order.id.slice(-8).toUpperCase()}`,
        status: order.status,
        partner: order.partner ? {
          id: order.partner.id,
          name: order.partner.name
        } : null,
        client: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email
        },
        totalItems: order.items.length,
        itemsWithAuthors: itemsWithAuthors.length,
        itemsWithoutAuthors: itemsWithoutAuthors.length,
        totalAmount: order.total || order.subtotal || 0,
        items: order.items.map(item => ({
          workId: item.work.id,
          workTitle: item.work.title,
          authorId: item.work.authorId,
          authorName: item.work.author?.name || null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        needsRoyaltyCalculation: itemsWithAuthors.length > 0,
        createdAt: order.createdAt
      }
    })

    // Vérifier les royalties existantes
    const allRoyalties = await prisma.royalty.findMany({
      where: {
        orderId: {
          in: validatedOrders.map(o => o.id)
        }
      },
      select: {
        id: true,
        orderId: true,
        workId: true,
        userId: true,
        amount: true,
        rate: true,
        paid: true
      }
    })

    // Associer les royalties aux commandes
    const enrichedAnalysis = analysis.map(order => {
      const orderRoyalties = allRoyalties.filter(r => r.orderId === order.orderId)
      const itemsWithRoyalties = order.items.map(item => {
        const royalty = orderRoyalties.find(r => r.workId === item.workId && r.userId === item.authorId)
        return {
          ...item,
          hasRoyalty: !!royalty,
          royalty: royalty ? {
            id: royalty.id,
            amount: royalty.amount,
            rate: royalty.rate,
            paid: royalty.paid
          } : null
        }
      })

      return {
        ...order,
        items: itemsWithRoyalties,
        royaltiesCount: orderRoyalties.length,
        totalRoyaltiesAmount: orderRoyalties.reduce((sum, r) => sum + r.amount, 0)
      }
    })

    // Statistiques globales
    const stats = {
      totalValidatedOrders: validatedOrders.length,
      ordersWithAuthors: enrichedAnalysis.filter(o => o.itemsWithAuthors > 0).length,
      ordersWithoutAuthors: enrichedAnalysis.filter(o => o.itemsWithAuthors === 0).length,
      totalItemsWithAuthors: enrichedAnalysis.reduce((sum, o) => sum + o.itemsWithAuthors, 0),
      totalItemsWithoutAuthors: enrichedAnalysis.reduce((sum, o) => sum + o.itemsWithoutAuthors, 0),
      ordersNeedingRoyaltyCalculation: enrichedAnalysis.filter(o => 
        o.itemsWithAuthors > 0 && o.royaltiesCount === 0
      ).length,
      totalRoyaltiesCreated: allRoyalties.length,
      totalRoyaltiesAmount: allRoyalties.reduce((sum, r) => sum + r.amount, 0)
    }

    return NextResponse.json({
      stats,
      orders: enrichedAnalysis
    })

  } catch (error: any) {
    console.error('Erreur lors de la vérification des commandes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


