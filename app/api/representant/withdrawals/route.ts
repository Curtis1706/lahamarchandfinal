import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/representant/withdrawals - Récupérer les retraits du représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les commissions payées (commandes livrées)
    const deliveredOrders = await prisma.order.findMany({
      where: { 
        userId: user.id,
        status: "DELIVERED"
      },
      include: {
        items: true
      }
    })

    // Calculer le solde disponible (10% des commandes livrées)
    const commissionRate = 0.10
    const totalCommissions = deliveredOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
      return sum + (orderTotal * commissionRate)
    }, 0)

    // Récupérer les retraits
    const withdrawals = await prisma.representantWithdrawal.findMany({
      where: { userId: user.id },
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

    // Calculer le total retiré (seulement les retraits approuvés ou payés)
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'APPROVED' || w.status === 'PAID')
      .reduce((sum, w) => sum + w.amount, 0)

    // Solde disponible = commissions payées - retraits approuvés/payés
    const availableBalance = totalCommissions - totalWithdrawn

    return NextResponse.json({
      availableBalance: Math.round(availableBalance),
      totalCommissions: Math.round(totalCommissions),
      totalWithdrawn: Math.round(totalWithdrawn),
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        amount: w.amount,
        method: w.method,
        momoNumber: w.momoNumber,
        bankName: w.bankName,
        bankAccount: w.bankAccount,
        bankAccountName: w.bankAccountName,
        status: w.status,
        requestedAt: w.requestedAt,
        validatedAt: w.validatedAt,
        paidAt: w.paidAt,
        rejectionReason: w.rejectionReason,
        validatedBy: w.validatedBy
      }))
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error fetching withdrawals:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des retraits" },
      { status: 500 }
    )
  }
}

// POST /api/representant/withdrawals - Créer une demande de retrait
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

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

    // Calculer le solde disponible
    const deliveredOrders = await prisma.order.findMany({
      where: { 
        userId: user.id,
        status: "DELIVERED"
      },
      include: {
        items: true
      }
    })

    const commissionRate = 0.10
    const totalCommissions = deliveredOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
      return sum + (orderTotal * commissionRate)
    }, 0)

    const withdrawals = await prisma.representantWithdrawal.findMany({
      where: { 
        userId: user.id,
        status: { in: ['APPROVED', 'PAID'] }
      }
    })

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0)
    const availableBalance = totalCommissions - totalWithdrawn

    // Vérifier le montant minimum
    const MIN_WITHDRAWAL_AMOUNT = 5000
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { 
          error: `Montant minimum de retrait: ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} F CFA`,
        },
        { status: 400 }
      )
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const pendingWithdrawal = await prisma.representantWithdrawal.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] }
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
    const withdrawal = await prisma.representantWithdrawal.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        method: method,
        momoNumber: method === 'MOMO' ? momoNumber : null,
        bankName: method === 'BANK' ? bankName : null,
        bankAccount: method === 'BANK' ? bankAccount : null,
        bankAccountName: method === 'BANK' ? bankAccountName : null,
        status: 'PENDING'
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
          title: "Nouvelle demande de retrait - Représentant",
          message: `Le représentant ${user.name} a demandé un retrait de ${amount.toLocaleString()} F CFA`,
          type: "WITHDRAWAL_REQUEST",
          data: JSON.stringify({
            withdrawalId: withdrawal.id,
            userId: user.id,
            userName: user.name,
            amount: withdrawal.amount,
            method: withdrawal.method
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error creating withdrawal:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande de retrait: " + error.message },
      { status: 500 }
    )
  }
}

