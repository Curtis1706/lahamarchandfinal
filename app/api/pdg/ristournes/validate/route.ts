import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RebateStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// PUT /api/pdg/ristournes/validate - Valider une ristourne partenaire
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { rebateId, action } = body // action: 'validate' | 'pay' | 'cancel'

    if (!rebateId || !action) {
      return NextResponse.json(
        { error: 'rebateId et action sont requis' },
        { status: 400 }
      )
    }

    const rebate = await prisma.partnerRebate.findUnique({
      where: { id: rebateId },
      include: {
        partner: { select: { id: true, name: true } }
      }
    })

    if (!rebate) {
      return NextResponse.json(
        { error: 'Ristourne introuvable' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (action === 'validate') {
      updateData = {
        status: 'VALIDATED',
        validatedById: session.user.id,
        validatedAt: new Date()
      }
    } else if (action === 'pay') {
      updateData = {
        status: 'PAID',
        paidAt: new Date()
      }
      // Si pas encore validée, valider aussi
      if (rebate.status === 'PENDING') {
        updateData.validatedById = session.user.id
        updateData.validatedAt = new Date()
      }
    } else if (action === 'cancel') {
      updateData = {
        status: 'CANCELLED'
      }
    } else {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      )
    }

    const updatedRebate = await prisma.partnerRebate.update({
      where: { id: rebateId },
      data: updateData,
      include: {
        partner: { select: { id: true, name: true } },
        validatedBy: { select: { id: true, name: true } }
      }
    })

    // Créer une notification pour le partenaire
    if (rebate.partner?.userId) {
      await prisma.notification.create({
        data: {
          userId: rebate.partner.userId,
          title: action === 'pay' ? 'Ristourne payée' : action === 'validate' ? 'Ristourne validée' : 'Ristourne annulée',
          message: `Votre ristourne de ${updatedRebate.amount.toLocaleString()} F CFA a été ${action === 'pay' ? 'payée' : action === 'validate' ? 'validée' : 'annulée'}`,
          type: 'REBATE_UPDATE',
          data: JSON.stringify({ rebateId: updatedRebate.id, action })
        }
      })
    }

    return NextResponse.json({
      message: `Ristourne ${action === 'pay' ? 'payée' : action === 'validate' ? 'validée' : 'annulée'} avec succès`,
      rebate: updatedRebate
    })

  } catch (error: any) {
    logger.error('Erreur lors de la validation de la ristourne:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


