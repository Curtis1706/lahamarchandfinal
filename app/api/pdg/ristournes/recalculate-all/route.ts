import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculatePartnerRebate, calculateAuthorRoyalty } from "@/lib/rebate-calculator"
import { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// POST /api/pdg/ristournes/recalculate-all - Recalculer les ristournes pour toutes les commandes validées
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer toutes les commandes validées/livrées qui n'ont pas encore de ristournes/royalties
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
                authorId: true
              }
            }
          }
        },
        partner: true
      }
    })

    const results = {
      ordersProcessed: 0,
      partnerRebatesCreated: 0,
      authorRoyaltiesCreated: 0,
      errors: [] as string[]
    }

    for (const order of validatedOrders) {
      try {
        // 1. Calculer les ristournes partenaires si nécessaire
        if (order.partnerId && order.partner) {
          const existingRebate = await prisma.partnerRebate.findFirst({
            where: {
              orderId: order.id,
              partnerId: order.partnerId
            }
          })

          if (!existingRebate) {
            const totalAmount = order.total || order.subtotal || 0
            if (totalAmount > 0) {
              const { amount, rate } = await calculatePartnerRebate(
                order.id,
                order.partnerId,
                totalAmount
              )

              if (amount > 0) {
                await prisma.partnerRebate.create({
                  data: {
                    partnerId: order.partnerId,
                    orderId: order.id,
                    amount,
                    rate,
                    status: 'PENDING'
                  }
                })
                results.partnerRebatesCreated++
              }
            }
          }
        }

        // 2. Calculer les droits d'auteur pour chaque item
        for (const item of order.items) {
          const work = item.work
          if (!work || !work.authorId) continue

          // Vérifier si une royalty existe déjà
          const existingRoyalty = await prisma.royalty.findFirst({
            where: {
              orderId: order.id,
              workId: work.id,
              userId: work.authorId
            }
          })

          const saleAmount = item.price * item.quantity
          if (saleAmount > 0) {
            const { amount, rate } = await calculateAuthorRoyalty(
              work.id,
              work.authorId,
              saleAmount
            )

            if (amount > 0) {
              if (existingRoyalty) {
                // Mettre à jour la royalty existante si le montant est différent (ou si c'est 0)
                if (existingRoyalty.amount !== amount || existingRoyalty.amount === 0) {
                  await prisma.royalty.update({
                    where: { id: existingRoyalty.id },
                    data: {
                      amount,
                      rate
                    }
                  })
                  results.authorRoyaltiesCreated++
                }
              } else {
                // Créer une nouvelle royalty
                await prisma.royalty.create({
                  data: {
                    workId: work.id,
                    userId: work.authorId,
                    orderId: order.id,
                    amount,
                    rate,
                    paid: false
                  }
                })
                results.authorRoyaltiesCreated++
              }
            }
          }
        }

        results.ordersProcessed++
      } catch (error: any) {
        results.errors.push(`Commande ${order.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: 'Recalcul terminé',
      results
    })

  } catch (error: any) {
    logger.error('Erreur lors du recalcul des ristournes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

