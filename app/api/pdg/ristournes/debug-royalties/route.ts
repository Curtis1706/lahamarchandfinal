import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/ristournes/debug-royalties - Debug des royalties pour comprendre pourquoi les montants sont à 0
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer toutes les royalties
    const royalties = await prisma.royalty.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        work: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            items: {
              select: {
                id: true,
                workId: true,
                quantity: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Analyser chaque royalty
    const analysis = royalties.map(royalty => {
      const orderItem = royalty.order?.items.find(item => item.workId === royalty.workId)
      const expectedAmount = orderItem ? (orderItem.price * orderItem.quantity * (royalty.rate || 0) / 100) : 0

      return {
        royaltyId: royalty.id,
        author: {
          id: royalty.userId,
          name: royalty.user.name,
          email: royalty.user.email
        },
        work: {
          id: royalty.workId,
          title: royalty.work.title,
          price: royalty.work.price
        },
        order: royalty.order ? {
          id: royalty.order.id,
          status: royalty.order.status,
          total: royalty.order.total
        } : null,
        orderItem: orderItem ? {
          quantity: orderItem.quantity,
          price: orderItem.price,
          subtotal: orderItem.price * orderItem.quantity
        } : null,
        royalty: {
          amount: royalty.amount,
          rate: royalty.rate,
          paid: royalty.paid,
          expectedAmount: expectedAmount,
          difference: royalty.amount - expectedAmount
        },
        createdAt: royalty.createdAt
      }
    })

    // Vérifier les taux configurés
    const rebateRates = await prisma.rebateRate.findMany({
      where: {
        type: {
          in: ['GLOBAL', 'AUTHOR', 'WORK']
        },
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        work: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Statistiques
    const stats = {
      totalRoyalties: royalties.length,
      royaltiesWithZeroAmount: royalties.filter(r => r.amount === 0).length,
      royaltiesWithAmount: royalties.filter(r => r.amount > 0).length,
      totalAmount: royalties.reduce((sum, r) => sum + r.amount, 0),
      totalPaid: royalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0),
      totalPending: royalties.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0),
      rebateRatesCount: rebateRates.length
    }

    return NextResponse.json({
      stats,
      royalties: analysis,
      rebateRates
    })

  } catch (error: any) {
    console.error('Erreur lors du debug des royalties:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


