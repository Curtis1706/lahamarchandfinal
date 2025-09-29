import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST /api/partenaire/sales/register - Enregistrer une vente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { workId, quantity, clientName, clientPhone, notes } = body

    if (!workId || !quantity || quantity <= 0) {
      return NextResponse.json({ 
        error: 'ID de l\'œuvre et quantité requise' 
      }, { status: 400 })
    }

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Vérifier que le partenaire a du stock disponible pour cette œuvre
    const partnerStock = await prisma.partnerStock.findFirst({
      where: {
        partnerId: partner.id,
        workId: workId
      },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        }
      }
    })

    if (!partnerStock) {
      return NextResponse.json({ 
        error: 'Cette œuvre n\'est pas allouée à votre stock' 
      }, { status: 400 })
    }

    if (partnerStock.availableQuantity < quantity) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${partnerStock.availableQuantity}, Demandé: ${quantity}` 
      }, { status: 400 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le stock partenaire
      const updatedPartnerStock = await tx.partnerStock.update({
        where: {
          id: partnerStock.id
        },
        data: {
          soldQuantity: {
            increment: quantity
          },
          availableQuantity: {
            decrement: quantity
          },
          updatedAt: new Date()
        }
      })

      // Créer un mouvement de stock
      await tx.stockMovement.create({
        data: {
          workId: workId,
          type: 'PARTNER_SALE',
          quantity: -quantity, // Négatif car c'est une sortie
          reason: `Vente partenaire - ${clientName || 'Client'}`,
          reference: `PARTNER_SALE_${partner.id}_${Date.now()}`,
          performedBy: session.user.id,
          partnerId: partner.id
        }
      })

      // Créer une notification pour le PDG
      await tx.notification.create({
        data: {
          userId: session.user.id, // Le PDG recevra la notification
          title: 'Vente enregistrée par partenaire',
          message: `Le partenaire ${partner.name} a enregistré une vente de ${quantity} exemplaire(s) de "${partnerStock.work.title}"`,
          type: 'PARTNER_SALE',
          data: JSON.stringify({
            partnerId: partner.id,
            partnerName: partner.name,
            workId: workId,
            workTitle: partnerStock.work.title,
            quantity: quantity,
            clientName: clientName,
            clientPhone: clientPhone
          })
        }
      })

      return updatedPartnerStock
    })

    return NextResponse.json({
      success: true,
      message: 'Vente enregistrée avec succès',
      stock: {
        workId: workId,
        workTitle: partnerStock.work.title,
        soldQuantity: quantity,
        remainingStock: result.availableQuantity
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement de la vente:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

