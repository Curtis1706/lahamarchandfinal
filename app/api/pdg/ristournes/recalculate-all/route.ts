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
        // Calculer le ratio de réduction pour cette commande
        let discountRatio = 1
        let effectiveSubtotal = order.subtotal || 0

        // Si subtotal est 0 ou invalide, on le recalcule depuis les items
        if (effectiveSubtotal <= 0 && order.items && order.items.length > 0) {
          effectiveSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }

        if (effectiveSubtotal > 0) {
          discountRatio = order.total / effectiveSubtotal
        }

        // 1. Calculer les ristournes partenaires si nécessaire
        if (order.partnerId && order.partner) {
          const totalAmount = order.total || 0
          if (totalAmount > 0) {
            const { amount, rate } = await calculatePartnerRebate(
              order.id,
              order.partnerId,
              totalAmount,
              discountRatio
            )

            const existingRebate = await prisma.partnerRebate.findFirst({
              where: {
                orderId: order.id,
                partnerId: order.partnerId
              }
            })

            if (existingRebate) {
              // Mettre à jour si différent
              if (Math.abs(existingRebate.amount - amount) > 0.01) {
                await prisma.partnerRebate.update({
                  where: { id: existingRebate.id },
                  data: { amount, rate }
                })
                results.partnerRebatesCreated++ // On compte aussi les mises à jour
              }
            } else if (amount > 0) {
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

        // 2. Calculer les droits d'auteur pour chaque item
        for (const item of order.items) {
          const work = item.work
          if (!work || !work.authorId) continue

          const saleAmount = item.price * item.quantity * discountRatio
          if (saleAmount > 0) {
            const { amount, rate } = await calculateAuthorRoyalty(
              work.id,
              work.authorId,
              saleAmount,
              discountRatio
            )

            const existingRoyalty = await prisma.royalty.findFirst({
              where: {
                orderId: order.id,
                workId: work.id,
                userId: work.authorId
              }
            })

            if (existingRoyalty) {
              // Mettre à jour la royalty existante si le montant est différent
              if (Math.abs(existingRoyalty.amount - amount) > 0.01) {
                await prisma.royalty.update({
                  where: { id: existingRoyalty.id },
                  data: {
                    amount,
                    rate
                  }
                })
                results.authorRoyaltiesCreated++
              }
            } else if (amount > 0) {
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

