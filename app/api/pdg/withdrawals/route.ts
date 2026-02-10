import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WithdrawalStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/pdg/withdrawals - Récupérer toutes les demandes de retrait
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const authorId = searchParams.get('authorId')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status as WithdrawalStatus
    }
    if (authorId) {
      where.userId = authorId
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    })

    // Pour chaque retrait, calculer le solde de l'auteur
    const withdrawalsWithBalance = await Promise.all(
      withdrawals.map(async (withdrawal) => {
        // Royalties totales générées
        const allRoyalties = await prisma.royalty.findMany({
          where: { userId: withdrawal.userId },
          select: { amount: true, paid: true, approved: true }
        })
        const totalGenerated = allRoyalties.reduce((sum, r) => sum + r.amount, 0)
        const totalPaidRoyalties = allRoyalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0)
        const totalApprovedRoyalties = allRoyalties.filter(r => r.approved).reduce((sum, r) => sum + r.amount, 0)

        // Retraits (PENDING, APPROVED, PAID)
        const authorWithdrawals = await prisma.withdrawal.findMany({
          where: {
            userId: withdrawal.userId,
            status: { in: ['PENDING', 'APPROVED', 'PAID'] }
          },
          select: { amount: true }
        })

        const totalWithdrawn = authorWithdrawals.reduce((sum, w) => sum + w.amount, 0)
        // Solde disponible = royalties totales - retraits
        const availableBalance = totalGenerated - totalWithdrawn

        return {
          id: withdrawal.id,
          amount: withdrawal.amount,
          method: withdrawal.method,
          momoNumber: withdrawal.momoNumber,
          bankName: withdrawal.bankName,
          bankAccount: withdrawal.bankAccount,
          bankAccountName: withdrawal.bankAccountName,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt.toISOString(),
          validatedAt: withdrawal.validatedAt?.toISOString(),
          paidAt: withdrawal.paidAt?.toISOString(),
          rejectionReason: withdrawal.rejectionReason,
          notes: withdrawal.notes,
          author: {
            id: withdrawal.user.id,
            name: withdrawal.user.name,
            email: withdrawal.user.email,
            phone: withdrawal.user.phone,
            balance: {
              totalPaid: totalPaidRoyalties,
              totalApproved: totalApprovedRoyalties,
              totalWithdrawn,
              available: Math.max(0, availableBalance)
            }
          },
          validatedBy: withdrawal.validatedBy ? {
            id: withdrawal.validatedBy.id,
            name: withdrawal.validatedBy.name,
            email: withdrawal.validatedBy.email
          } : null
        }
      })
    )

    return NextResponse.json({
      withdrawals: withdrawalsWithBalance,
      stats: {
        pending: withdrawals.filter(w => w.status === 'PENDING').length,
        approved: withdrawals.filter(w => w.status === 'APPROVED').length,
        paid: withdrawals.filter(w => w.status === 'PAID').length,
        rejected: withdrawals.filter(w => w.status === 'REJECTED').length
      }
    })

  } catch (error: any) {
    logger.error("❌ Error fetching withdrawals:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/withdrawals - Valider, rejeter ou marquer comme payé un retrait
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { withdrawalId, action, rejectionReason, notes } = body

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'withdrawalId et action sont requis' }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Retrait introuvable' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'APPROVE':
        if (withdrawal.status !== 'PENDING') {
          return NextResponse.json({ error: 'Seuls les retraits en attente peuvent être approuvés' }, { status: 400 })
        }
        updateData = {
          status: 'APPROVED',
          validatedById: session.user.id,
          validatedAt: new Date(),
          notes: notes || null
        }
        break

      case 'REJECT':
        if (withdrawal.status !== 'PENDING') {
          return NextResponse.json({ error: 'Seuls les retraits en attente peuvent être rejetés' }, { status: 400 })
        }
        if (!rejectionReason) {
          return NextResponse.json({ error: 'La raison du rejet est requise' }, { status: 400 })
        }
        updateData = {
          status: 'REJECTED',
          validatedById: session.user.id,
          validatedAt: new Date(),
          rejectionReason: rejectionReason,
          notes: notes || null
        }
        break

      case 'MARK_PAID':
        if (withdrawal.status !== 'APPROVED') {
          return NextResponse.json({ error: 'Seuls les retraits approuvés peuvent être marqués comme payés' }, { status: 400 })
        }

        // Marquer les royalties correspondantes comme payées (pour les statistiques)
        // On marque les royalties de l'auteur comme payées jusqu'à couvrir le montant du retrait
        const authorRoyalties = await prisma.royalty.findMany({
          where: {
            userId: withdrawal.userId,
            paid: false
          },
          orderBy: { createdAt: 'asc' }
        })

        let remainingAmount = withdrawal.amount
        const royaltiesToMarkAsPaid: string[] = []

        for (const royalty of authorRoyalties) {
          if (remainingAmount <= 0) break
          if (royalty.amount <= remainingAmount) {
            royaltiesToMarkAsPaid.push(royalty.id)
            remainingAmount -= royalty.amount
          }
        }

        if (royaltiesToMarkAsPaid.length > 0) {
          await prisma.royalty.updateMany({
            where: { id: { in: royaltiesToMarkAsPaid } },
            data: { paid: true, paidAt: new Date() }
          })
        }

        updateData = {
          status: 'PAID',
          paidAt: new Date(),
          notes: notes || null
        }
        break

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Créer une notification pour l'auteur
    const notificationTitle = action === 'APPROVE'
      ? 'Retrait approuvé'
      : action === 'REJECT'
        ? 'Retrait rejeté'
        : 'Retrait payé'

    const notificationMessage = action === 'APPROVE'
      ? `Votre demande de retrait de ${withdrawal.amount.toLocaleString()} F CFA a été approuvée`
      : action === 'REJECT'
        ? `Votre demande de retrait de ${withdrawal.amount.toLocaleString()} F CFA a été rejetée. Raison: ${rejectionReason}`
        : `Votre retrait de ${withdrawal.amount.toLocaleString()} F CFA a été payé`

    await prisma.notification.create({
      data: {
        userId: withdrawal.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'WITHDRAWAL_UPDATE',
        data: JSON.stringify({ withdrawalId: withdrawal.id, action })
      }
    })

    return NextResponse.json({
      message: `Retrait ${action === 'APPROVE' ? 'approuvé' : action === 'REJECT' ? 'rejeté' : 'marqué comme payé'} avec succès`,
      withdrawal: {
        id: updatedWithdrawal.id,
        amount: updatedWithdrawal.amount,
        status: updatedWithdrawal.status,
        validatedAt: updatedWithdrawal.validatedAt?.toISOString(),
        paidAt: updatedWithdrawal.paidAt?.toISOString()
      }
    })

  } catch (error: any) {
    logger.error("❌ Error updating withdrawal:", error)
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

