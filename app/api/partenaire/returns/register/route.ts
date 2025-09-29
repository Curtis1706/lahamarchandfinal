import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST /api/partenaire/returns/register - Enregistrer un retour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { workId, quantity, reason, notes } = body

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

    // Vérifier que le partenaire a du stock alloué pour cette œuvre
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

    if (partnerStock.allocatedQuantity < quantity) {
      return NextResponse.json({ 
        error: `Quantité de retour invalide. Alloué: ${partnerStock.allocatedQuantity}, Retour: ${quantity}` 
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
          returnedQuantity: {
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
          type: 'PARTNER_RETURN',
          quantity: quantity, // Positif car c'est un retour au stock central
          reason: `Retour partenaire - ${reason || 'Non spécifié'}`,
          reference: `PARTNER_RETURN_${partner.id}_${Date.now()}`,
          performedBy: session.user.id,
          partnerId: partner.id
        }
      })

      // Créer une notification pour le PDG
      await tx.notification.create({
        data: {
          userId: session.user.id, // Le PDG recevra la notification
          title: 'Retour de stock par partenaire',
          message: `Le partenaire ${partner.name} a retourné ${quantity} exemplaire(s) de "${partnerStock.work.title}"`,
          type: 'PARTNER_RETURN',
          data: JSON.stringify({
            partnerId: partner.id,
            partnerName: partner.name,
            workId: workId,
            workTitle: partnerStock.work.title,
            quantity: quantity,
            reason: reason,
            notes: notes
          })
        }
      })

      return updatedPartnerStock
    })

    return NextResponse.json({
      success: true,
      message: 'Retour enregistré avec succès',
      stock: {
        workId: workId,
        workTitle: partnerStock.work.title,
        returnedQuantity: quantity,
        remainingStock: result.availableQuantity
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement du retour:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

