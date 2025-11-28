import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/auteur/royalties - Récupérer les royalties de l'auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    const userId = session.user.id

    // Récupérer toutes les royalties de l'auteur
    const royalties = await prisma.royalty.findMany({
      where: { userId: userId },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            discipline: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            items: {
              select: {
                workId: true,
                quantity: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Récupérer les retraits pour calculer le solde disponible
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: userId,
        status: { in: ['APPROVED', 'PAID'] }
      },
      select: { amount: true }
    })

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const totalPaid = royalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0)
    // Solde disponible = royalties approuvées (pas encore payées) - retraits approuvés/payés
    const totalApproved = royalties.filter(r => r.approved && !r.paid).reduce((sum, r) => sum + r.amount, 0)
    const availableBalance = Math.max(0, totalApproved - totalWithdrawn)

    // Calculer les statistiques
    const stats = {
      totalRoyalties: royalties.reduce((sum, r) => sum + r.amount, 0),
      paidRoyalties: totalPaid,
      approvedRoyalties: totalApproved, // Royalties approuvées et disponibles pour retrait
      pendingRoyalties: royalties.filter(r => !r.approved && !r.paid).reduce((sum, r) => sum + r.amount, 0),
      totalPayments: royalties.filter(r => r.paid).length,
      pendingPayments: royalties.filter(r => !r.approved && !r.paid).length,
      availableBalance: availableBalance,
      totalWithdrawn: totalWithdrawn
    }

    // Formater les royalties pour l'affichage
    const formattedRoyalties = royalties.map(royalty => {
      // Filtrer les items de la commande par workId de la royalty
      const orderItem = royalty.order?.items?.find(item => item.workId === royalty.workId)
      const saleAmount = orderItem ? (orderItem.price * orderItem.quantity) : 0
      
      return {
        id: royalty.id,
        amount: royalty.amount,
        rate: royalty.rate,
        approved: royalty.approved,
        approvedAt: royalty.approvedAt ? royalty.approvedAt.toISOString() : null,
        paid: royalty.paid,
        paidAt: royalty.paidAt ? royalty.paidAt.toISOString() : null,
        createdAt: royalty.createdAt.toISOString(),
        work: {
          id: royalty.work.id,
          title: royalty.work.title,
          isbn: royalty.work.isbn,
          discipline: royalty.work.discipline
        },
        order: royalty.order ? {
          id: royalty.order.id,
          status: royalty.order.status,
          saleDate: royalty.order.createdAt.toISOString(),
          saleAmount: saleAmount,
          quantity: orderItem?.quantity || 0,
          unitPrice: orderItem?.price || 0
        } : null
      }
    })

    return NextResponse.json({
      royalties: formattedRoyalties,
      stats,
      balance: {
        totalPaid: totalPaid,
        totalWithdrawn: totalWithdrawn,
        available: availableBalance
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching author royalties:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

