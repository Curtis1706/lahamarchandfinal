import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

/**
 * GET /api/partenaire/stock/history?workId=xxx
 * 
 * Retourne l'historique des mouvements de stock pour un produit spécifique
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')

    if (!workId) {
      return NextResponse.json({ error: 'workId requis' }, { status: 400 })
    }

    // Récupérer le partenaire
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Vérifier que le produit est bien alloué au partenaire
    const partnerStock = await prisma.partnerStock.findFirst({
      where: {
        partnerId: partner.id,
        workId: workId
      }
    })

    if (!partnerStock) {
      return NextResponse.json({ error: 'Produit non alloué à ce partenaire' }, { status: 404 })
    }

    // Récupérer tous les mouvements de stock pour ce produit et ce partenaire
    const movements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        workId: workId,
        type: {
          in: ['PARTNER_ALLOCATION', 'PARTNER_SALE', 'PARTNER_RETURN']
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Récupérer également les informations du stock actuel
    const stockInfo = await prisma.partnerStock.findFirst({
      where: {
        partnerId: partner.id,
        workId: workId
      },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true
          }
        }
      }
    })

    // Transformer les mouvements pour l'UI
    const history = movements.map(m => {
      const quantity = Math.abs(m.quantity)
      const isNegative = m.quantity < 0

      return {
        id: m.id,
        type: m.type,
        typeLabel: getMovementTypeLabel(m.type),
        quantity: quantity,
        isNegative,
        unitPrice: m.unitPrice,
        totalAmount: m.totalAmount,
        reason: m.reason,
        reference: m.reference,
        createdAt: m.createdAt.toISOString(),
        performedBy: m.performedByUser ? {
          name: m.performedByUser.name,
          email: m.performedByUser.email
        } : null
      }
    })

    return NextResponse.json({
      work: stockInfo?.work || null,
      stockInfo: stockInfo ? {
        allocatedQuantity: stockInfo.allocatedQuantity,
        soldQuantity: stockInfo.soldQuantity,
        returnedQuantity: stockInfo.returnedQuantity,
        availableQuantity: stockInfo.allocatedQuantity - stockInfo.soldQuantity + stockInfo.returnedQuantity
      } : null,
      history
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

function getMovementTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    'PARTNER_ALLOCATION': 'Allocation',
    'PARTNER_SALE': 'Vente',
    'PARTNER_RETURN': 'Retour'
  }
  return labels[type] || type
}

