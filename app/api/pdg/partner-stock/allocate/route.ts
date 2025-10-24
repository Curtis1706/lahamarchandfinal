import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST /api/pdg/partner-stock/allocate - Allouer du stock à un partenaire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { partnerId, workId, quantity, reason } = body

    if (!partnerId || !workId || !quantity || quantity <= 0) {
      return NextResponse.json({ 
        error: 'ID du partenaire, ID de l\'œuvre et quantité requise' 
      }, { status: 400 })
    }

    // Vérifier que le partenaire existe
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Vérifier que l'œuvre existe et est publiée
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: {
          select: {
            name: true
          }
        },
        discipline: {
          select: {
            name: true
          }
        }
      }
    })

    if (!work || work.status !== 'PUBLISHED') {
      return NextResponse.json({ 
        error: 'Œuvre non trouvée ou non publiée' 
      }, { status: 400 })
    }

    // Vérifier que le stock central est suffisant
    if (!work.stock || work.stock < quantity) {
      return NextResponse.json({
        error: `Stock insuffisant. Disponible: ${work.stock || 0}, Demandé: ${quantity}`,
        available: work.stock || 0,
        requested: quantity
      }, { status: 400 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier si le partenaire a déjà du stock pour cette œuvre
      const existingStock = await tx.partnerStock.findFirst({
        where: {
          partnerId: partnerId,
          workId: workId
        }
      })

      let partnerStock
      if (existingStock) {
        // Mettre à jour le stock existant
        partnerStock = await tx.partnerStock.update({
          where: {
            id: existingStock.id
          },
          data: {
            allocatedQuantity: {
              increment: quantity
            },
            availableQuantity: {
              increment: quantity
            },
            updatedAt: new Date()
          }
        })
      } else {
        // Créer un nouveau stock partenaire
        partnerStock = await tx.partnerStock.create({
          data: {
            partnerId: partnerId,
            workId: workId,
            allocatedQuantity: quantity,
            soldQuantity: 0,
            returnedQuantity: 0,
            availableQuantity: quantity
          }
        })
      }

      // Diminuer le stock central
      await tx.work.update({
        where: { id: workId },
        data: {
          stock: {
            decrement: quantity
          }
        }
      })

      // Créer un mouvement de stock
      await tx.stockMovement.create({
        data: {
          workId: workId,
          type: 'PARTNER_ALLOCATION',
          quantity: -quantity, // Négatif car c'est une sortie du stock central
          reason: `Allocation partenaire - ${reason || 'Non spécifié'}`,
          reference: `ALLOCATION_${partnerId}_${Date.now()}`,
          performedBy: session.user.id,
          partnerId: partnerId
        }
      })

      // Créer une notification pour le partenaire
      await tx.notification.create({
        data: {
          userId: partner.userId,
          title: 'Stock alloué',
          message: `Le PDG vous a alloué ${quantity} exemplaire(s) de "${work.title}"`,
          type: 'STOCK_ALLOCATION',
          data: JSON.stringify({
            workId: workId,
            workTitle: work.title,
            quantity: quantity,
            reason: reason
          })
        }
      })

      return partnerStock
    })

    return NextResponse.json({
      success: true,
      message: 'Stock alloué avec succès',
      allocation: {
        partnerId: partnerId,
        partnerName: partner.user.name,
        workId: workId,
        workTitle: work.title,
        quantity: quantity,
        totalAllocated: result.allocatedQuantity,
        available: result.availableQuantity
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'allocation de stock:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

