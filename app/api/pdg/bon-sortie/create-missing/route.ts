import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// POST /api/pdg/bon-sortie/create-missing - Créer les bons de sortie manquants pour les commandes validées/livrées
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body

    // Si un orderId est fourni, créer le bon pour cette commande spécifique
    if (orderId) {
      return await createDeliveryNoteForOrder(orderId, session.user.id)
    }

    // Sinon, créer les bons pour toutes les commandes validées/livrées sans bon
    const ordersWithoutDeliveryNote = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.VALIDATED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        },
        deliveryNote: null
      },
      include: {
        items: {
          include: {
            work: true
          }
        }
      }
    })

    const results = []
    const errors = []

    for (const order of ordersWithoutDeliveryNote) {
      try {
        const result = await createDeliveryNoteForOrder(order.id, session.user.id)
        results.push({
          orderId: order.id,
          success: true,
          deliveryNote: result.deliveryNote
        })
      } catch (error: any) {
        errors.push({
          orderId: order.id,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: `Traitement terminé: ${results.length} bons créés, ${errors.length} erreurs`,
      created: results.length,
      errors: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    logger.error('Error creating missing delivery notes:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création des bons de sortie manquants',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

async function createDeliveryNoteForOrder(orderId: string, userId: string) {
  // Vérifier qu'un bon de sortie n'existe pas déjà
  const existingDeliveryNote = await prisma.deliveryNote.findUnique({
    where: { orderId }
  })

  if (existingDeliveryNote) {
    return NextResponse.json({
      message: 'Un bon de sortie existe déjà pour cette commande',
      deliveryNote: existingDeliveryNote
    })
  }

  // Récupérer la commande avec ses items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          work: true
        }
      }
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  }

  // Utiliser une transaction pour garantir la cohérence
  const result = await prisma.$transaction(async (tx) => {
    // 1. Générer une référence unique pour le bon de sortie
    const year = new Date().getFullYear()
    const count = await tx.deliveryNote.count({
      where: {
        reference: {
          startsWith: `BS-${year}-`
        }
      }
    })
    const reference = `BS-${year}-${String(count + 1).padStart(4, '0')}`

    // 2. Créer le bon de sortie
    const deliveryNote = await tx.deliveryNote.create({
      data: {
        reference,
        orderId,
        generatedById: userId,
        status: order.status === OrderStatus.DELIVERED ? 'COMPLETED' : 'PENDING'
      }
    })

    // 3. Réduire le stock pour chaque item et créer des mouvements de stock
    // Note: Si la commande est déjà livrée, on ne réduit pas le stock (il a déjà été réduit)
    // Mais on crée quand même le mouvement pour l'historique
    for (const item of order.items) {
      const work = item.work
      const quantity = item.quantity

      // Vérifier que le stock est suffisant (sauf si déjà livré)
      if (order.status !== OrderStatus.DELIVERED && work.stock < quantity) {
        throw new Error(
          `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${quantity}`
        )
      }

      // Réduire le stock seulement si la commande n'est pas déjà livrée
      if (order.status !== OrderStatus.DELIVERED) {
        await tx.work.update({
          where: { id: work.id },
          data: {
            stock: {
              decrement: quantity
            },
            physicalStock: {
              decrement: quantity
            }
          }
        })
      }

      // Créer un mouvement de stock pour tracer l'historique
      await tx.stockMovement.create({
        data: {
          workId: work.id,
          type: 'OUTBOUND',
          quantity: -quantity, // Négatif car c'est une sortie
          reason: `Bon de sortie ${reference} - Commande ${orderId} (créé rétroactivement)`,
          reference: reference,
          performedBy: userId,
          partnerId: order.partnerId || null,
          unitPrice: item.price,
          totalAmount: item.price * quantity
        }
      })
    }

    return { deliveryNote, reference }
  })

  return NextResponse.json({
    message: 'Bon de sortie créé avec succès',
    deliveryNote: result.deliveryNote,
    reference: result.reference
  })
}

