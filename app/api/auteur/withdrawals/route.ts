import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WithdrawalMethod, WithdrawalStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/auteur/withdrawals - Récupérer les retraits de l'auteur et calculer le solde disponible
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    const userId = session.user.id

    // Récupérer toutes les royalties de l'auteur
    const royalties = await prisma.royalty.findMany({
      where: { userId: userId },
      select: {
        id: true,
        amount: true,
        approved: true,
        paid: true,
        paidAt: true
      }
    })

    // Calculer le solde disponible
    // NOUVELLE LOGIQUE : Solde disponible = Toutes les royalties générées - Tous les retraits (En cours ou payés)
    const totalRoyaltiesGenerated = royalties.reduce((sum, r) => sum + r.amount, 0)

    // Récupérer tous les retraits de l'auteur
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: userId },
      include: {
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

    // Calculer le total retiré (inclure PENDING, APPROVED et PAID pour déduire du solde disponible)
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'PENDING' || w.status === 'APPROVED' || w.status === 'PAID')
      .reduce((sum, w) => sum + w.amount, 0)

    // Solde disponible = royalties totales - retraits (pending, approuvés et payés)
    const availableBalance = Math.max(0, totalRoyaltiesGenerated - totalWithdrawn)

    // Formater les retraits pour l'affichage
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
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
      validatedBy: withdrawal.validatedBy ? {
        id: withdrawal.validatedBy.id,
        name: withdrawal.validatedBy.name,
        email: withdrawal.validatedBy.email
      } : null,
      notes: withdrawal.notes
    }))

    // Calculer aussi le total des royalties payées pour l'affichage
    const totalRoyaltiesPaid = royalties
      .filter(r => r.paid)
      .reduce((sum, r) => sum + r.amount, 0)

    // Calculer les royalties approuvées (pour information)
    const totalRoyaltiesApproved = royalties
      .filter(r => r.approved)
      .reduce((sum, r) => sum + r.amount, 0)

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      balance: {
        totalRoyalties: totalRoyaltiesGenerated,
        totalPaid: totalRoyaltiesPaid,
        totalApproved: totalRoyaltiesApproved,
        totalWithdrawn: totalWithdrawn,
        available: availableBalance
      }
    })

  } catch (error: any) {
    logger.error("❌ Error fetching author withdrawals:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST /api/auteur/withdrawals - Créer une demande de retrait
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { amount, method, momoNumber, bankName, bankAccount, bankAccountName } = body

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Le montant doit être supérieur à 0" }, { status: 400 })
    }

    if (!method || !['MOMO', 'BANK', 'CASH'].includes(method)) {
      return NextResponse.json({ error: "Méthode de paiement invalide" }, { status: 400 })
    }

    if (method === 'MOMO' && !momoNumber) {
      return NextResponse.json({ error: "Le numéro Mobile Money est requis" }, { status: 400 })
    }

    if (method === 'BANK' && (!bankName || !bankAccount)) {
      return NextResponse.json({ error: "Les informations bancaires sont requises" }, { status: 400 })
    }

    // Vérifier le solde disponible (Toutes les royalties générées)
    const royalties = await prisma.royalty.findMany({
      where: { userId: userId },
      select: { amount: true }
    })

    const totalGenerated = royalties.reduce((sum, r) => sum + r.amount, 0)

    // Récupérer tous les retraits (PENDING, APPROVED, PAID) pour calculer le solde disponible
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: userId,
        status: { in: ['PENDING', 'APPROVED', 'PAID'] }
      },
      select: { amount: true }
    })

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const availableBalance = Math.max(0, totalGenerated - totalWithdrawn)

    // Vérifier le montant minimum (par défaut 5000 F CFA, peut être configuré)
    const MIN_WITHDRAWAL_AMOUNT = 5000
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        {
          error: `Montant minimum de retrait: ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA`,
        },
        { status: 400 }
      )
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours (pending seulement)
    // Note: On permet plusieurs demandes APPROVED car elles peuvent être traitées par lots
    const pendingWithdrawal = await prisma.withdrawal.findFirst({
      where: {
        userId: userId,
        status: 'PENDING' // Seulement les demandes en attente
      }
    })

    if (pendingWithdrawal) {
      return NextResponse.json(
        {
          error: "Vous avez déjà une demande de retrait en cours. Veuillez attendre qu'elle soit traitée.",
        },
        { status: 400 }
      )
    }

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: `Solde insuffisant. Solde disponible: ${availableBalance.toLocaleString()} F CFA`,
          availableBalance
        },
        { status: 400 }
      )
    }

    // Créer la demande de retrait
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: userId,
        amount: parseFloat(amount),
        method: method as WithdrawalMethod,
        momoNumber: method === 'MOMO' ? momoNumber : null,
        bankName: method === 'BANK' ? bankName : null,
        bankAccount: method === 'BANK' ? bankAccount : null,
        bankAccountName: method === 'BANK' ? bankAccountName : null,
        status: 'PENDING'
      },
      include: {
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Créer une notification pour le PDG
    const pdg = await prisma.user.findFirst({
      where: { role: 'PDG' },
      select: { id: true }
    })

    if (pdg) {
      await prisma.notification.create({
        data: {
          userId: pdg.id,
          title: 'Nouvelle demande de retrait',
          message: `${session.user.name} a demandé un retrait de ${amount.toLocaleString()} F CFA`,
          type: 'WITHDRAWAL_REQUEST',
          data: JSON.stringify({ withdrawalId: withdrawal.id, authorId: userId })
        }
      })
    }

    return NextResponse.json({
      message: 'Demande de retrait créée avec succès',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt.toISOString()
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error("❌ Error creating withdrawal:", error)
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

