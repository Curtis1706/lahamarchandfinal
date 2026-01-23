import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculatePartnerRebate, calculateAuthorRoyalty } from "@/lib/rebate-calculator"
import { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// POST /api/pdg/ristournes/calculate - Calculer les ristournes pour une commande
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId est requis' },
        { status: 400 }
      )
    }

    // Récupérer la commande avec ses items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            work: {
              include: {
                author: true
              }
            }
          }
        },
        partner: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que la commande est validée
    if (!['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      return NextResponse.json(
        { error: 'La commande doit être validée pour calculer les ristournes' },
        { status: 400 }
      )
    }

    const results = {
      partnerRebates: [] as any[],
      authorRoyalties: [] as any[]
    }

    // Calculer les ristournes partenaires si c'est une commande partenaire
    if (order.partnerId && order.partner) {
      const totalAmount = order.total || order.subtotal || 0
      const { amount, rate } = await calculatePartnerRebate(
        order.id,
        order.partnerId,
        totalAmount
      )

      // Vérifier si une ristourne existe déjà pour cette commande
      const existingRebate = await prisma.partnerRebate.findFirst({
        where: {
          orderId: order.id,
          partnerId: order.partnerId
        }
      })

      if (!existingRebate) {
        const rebate = await prisma.partnerRebate.create({
          data: {
            partnerId: order.partnerId,
            orderId: order.id,
            amount,
            rate,
            status: 'PENDING'
          },
          include: {
            partner: { select: { id: true, name: true } }
          }
        })

        results.partnerRebates.push(rebate)
      }
    }

    // Calculer les droits d'auteur pour chaque item
    for (const item of order.items) {
      const work = item.work
      const author = work.author

      if (!author) {
        continue
      }

      const saleAmount = item.price * item.quantity
      const { amount, rate } = await calculateAuthorRoyalty(
        work.id,
        author.id,
        saleAmount
      )

      // Vérifier si une royalty existe déjà pour cette commande et cette œuvre
      const existingRoyalty = await prisma.royalty.findFirst({
        where: {
          orderId: order.id,
          workId: work.id,
          userId: author.id
        }
      })

      if (!existingRoyalty) {
        const royalty = await prisma.royalty.create({
          data: {
            workId: work.id,
            userId: author.id,
            orderId: order.id,
            amount,
            rate,
            paid: false
          },
          include: {
            user: { select: { id: true, name: true } },
            work: { select: { id: true, title: true } }
          }
        })

        results.authorRoyalties.push(royalty)
      }
    }

    return NextResponse.json({
      message: 'Ristournes calculées avec succès',
      results
    })

  } catch (error: any) {
    logger.error('Erreur lors du calcul des ristournes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


