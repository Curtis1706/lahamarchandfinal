import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Fonction utilitaire pour récupérer l'IP du client
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// POST /api/pdg/stock/corrections - Effectuer une correction de stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      workId, 
      correctionType, // 'quantity', 'price', 'movement'
      originalValue,
      correctedValue,
      correctionReason,
      movementId, // Si c'est une correction de mouvement
      notes
    } = body

    if (!workId || !correctionType || !correctionReason) {
      return NextResponse.json({ 
        error: 'ID de l\'œuvre, type de correction et raison sont requis' 
      }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ 
        error: 'Œuvre non trouvée' 
      }, { status: 404 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      let correctionMovement = null
      let updatedWork = work

      if (correctionType === 'quantity') {
        // Correction de quantité
        const quantityDiff = correctedValue - originalValue
        
        updatedWork = await tx.work.update({
          where: { id: workId },
          data: {
            stock: correctedValue,
            physicalStock: correctedValue
          }
        })

        // Créer un mouvement de correction
        correctionMovement = await tx.stockMovement.create({
          data: {
            workId,
            type: 'CORRECTION',
            quantity: quantityDiff,
            reason: `Correction quantité - ${correctionReason}`,
            reference: `CORRECTION_${workId}_${Date.now()}`,
            performedBy: session.user.id,
            source: 'Correction PDG',
            isCorrection: true,
            correctionReason: correctionReason
          }
        })

      } else if (correctionType === 'price') {
        // Correction de prix
        updatedWork = await tx.work.update({
          where: { id: workId },
          data: {
            price: correctedValue
          }
        })

        // Créer un mouvement de correction (sans impact sur la quantité)
        correctionMovement = await tx.stockMovement.create({
          data: {
            workId,
            type: 'CORRECTION',
            quantity: 0,
            reason: `Correction prix - ${correctionReason}`,
            reference: `PRICE_CORRECTION_${workId}_${Date.now()}`,
            performedBy: session.user.id,
            source: 'Correction PDG',
            unitPrice: correctedValue,
            totalAmount: 0,
            isCorrection: true,
            correctionReason: correctionReason
          }
        })

      } else if (correctionType === 'movement' && movementId) {
        // Correction d'un mouvement spécifique
        const originalMovement = await tx.stockMovement.findUnique({
          where: { id: movementId }
        })

        if (!originalMovement) {
          throw new Error('Mouvement original non trouvé')
        }

        // Annuler le mouvement original
        const cancelMovement = await tx.stockMovement.create({
          data: {
            workId,
            type: 'CORRECTION',
            quantity: -originalMovement.quantity,
            reason: `Annulation mouvement - ${correctionReason}`,
            reference: `CANCEL_${originalMovement.reference}`,
            performedBy: session.user.id,
            source: 'Correction PDG',
            isCorrection: true,
            correctionReason: correctionReason
          }
        })

        // Créer le mouvement corrigé
        correctionMovement = await tx.stockMovement.create({
          data: {
            workId,
            type: 'CORRECTION',
            quantity: correctedValue,
            reason: `Mouvement corrigé - ${correctionReason}`,
            reference: `CORRECTED_${originalMovement.reference}`,
            performedBy: session.user.id,
            source: 'Correction PDG',
            isCorrection: true,
            correctionReason: correctionReason
          }
        })

        // Mettre à jour le stock
        const totalDiff = correctedValue - originalMovement.quantity
        updatedWork = await tx.work.update({
          where: { id: workId },
          data: {
            stock: {
              increment: totalDiff
            },
            physicalStock: {
              increment: totalDiff
            }
          }
        })
      }

      // Créer une entrée d'audit
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'STOCK_CORRECTION',
          details: JSON.stringify({
            workId,
            workTitle: work.title,
            correctionType,
            originalValue,
            correctedValue,
            correctionReason,
            movementId: correctionMovement?.id,
            notes
          }),
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') || 'PDG Dashboard'
        }
      })

      return { correctionMovement, updatedWork }
    })

    return NextResponse.json({
      success: true,
      message: 'Correction effectuée avec succès',
      correction: {
        id: result.correctionMovement?.id,
        type: result.correctionMovement?.type,
        quantity: result.correctionMovement?.quantity,
        reason: result.correctionMovement?.reason,
        correctionReason: result.correctionMovement?.correctionReason,
        createdAt: result.correctionMovement?.createdAt.toISOString()
      },
      updatedWork: {
        id: result.updatedWork.id,
        title: result.updatedWork.title,
        stock: result.updatedWork.stock,
        physicalStock: result.updatedWork.physicalStock,
        price: result.updatedWork.price
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la correction:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

