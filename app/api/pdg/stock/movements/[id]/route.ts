import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/movements/[id] - Récupérer un mouvement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const movement = await prisma.stockMovement.findUnique({
      where: { id: params.id },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            stock: true
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    if (!movement) {
      return NextResponse.json({ 
        error: 'Mouvement non trouvé' 
      }, { status: 404 })
    }

    return NextResponse.json({
      movement: {
        id: movement.id,
        workId: movement.workId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference,
        source: movement.source,
        destination: movement.destination,
        unitPrice: movement.unitPrice,
        totalAmount: movement.totalAmount,
        partnerId: movement.partnerId,
        isCorrection: movement.isCorrection,
        correctionReason: movement.correctionReason,
        createdAt: movement.createdAt.toISOString(),
        work: movement.work,
        performedByUser: movement.performedByUser,
        partner: movement.partner
      }
    })

  } catch (error: any) {
    logger.error('Erreur lors de la récupération du mouvement:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

