import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RebateRateType } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/pdg/ristournes/rates - Récupérer les taux de ristourne
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as RebateRateType | null
    const partnerId = searchParams.get('partnerId')
    const userId = searchParams.get('userId')
    const workId = searchParams.get('workId')

    const where: any = {
      isActive: true
    }

    if (type) {
      where.type = type
    }
    if (partnerId) {
      where.partnerId = partnerId
    }
    if (userId) {
      where.userId = userId
    }
    if (workId) {
      where.workId = workId
    }

    const rates = await prisma.rebateRate.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        work: { select: { id: true, title: true, isbn: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ rates })

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des taux de ristourne:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/ristournes/rates - Créer ou mettre à jour un taux de ristourne
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { type, partnerId, userId, workId, rate, startDate, endDate } = body

    if (!type || !rate) {
      return NextResponse.json(
        { error: 'Le type et le taux sont requis' },
        { status: 400 }
      )
    }

    // Validation selon le type
    if (type === 'PARTNER' && !partnerId) {
      return NextResponse.json(
        { error: 'partnerId est requis pour un taux partenaire' },
        { status: 400 }
      )
    }
    if (type === 'AUTHOR' && !userId) {
      return NextResponse.json(
        { error: 'userId est requis pour un taux auteur' },
        { status: 400 }
      )
    }
    if (type === 'WORK' && !workId) {
      return NextResponse.json(
        { error: 'workId est requis pour un taux œuvre' },
        { status: 400 }
      )
    }

    // Désactiver les anciens taux actifs du même type
    const whereClause: any = {
      type,
      isActive: true
    }
    if (partnerId) whereClause.partnerId = partnerId
    if (userId) whereClause.userId = userId
    if (workId) whereClause.workId = workId

    await prisma.rebateRate.updateMany({
      where: whereClause,
      data: { isActive: false }
    })

    // Créer le nouveau taux
    const rebateRate = await prisma.rebateRate.create({
      data: {
        type,
        partnerId: partnerId || null,
        userId: userId || null,
        workId: workId || null,
        rate: Number(rate),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: session.user.id
      },
      include: {
        partner: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        work: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      message: 'Taux de ristourne créé avec succès',
      rebateRate
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Erreur lors de la création du taux de ristourne:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/ristournes/rates - Mettre à jour un taux de ristourne
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, rate, isActive, startDate, endDate } = body

    if (!id) {
      return NextResponse.json(
        { error: 'L\'ID du taux est requis' },
        { status: 400 }
      )
    }

    const rebateRate = await prisma.rebateRate.update({
      where: { id },
      data: {
        rate: rate !== undefined ? Number(rate) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: {
        partner: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        work: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      message: 'Taux de ristourne mis à jour avec succès',
      rebateRate
    })

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour du taux de ristourne:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/ristournes/rates - Désactiver un taux de ristourne
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'L\'ID du taux est requis' },
        { status: 400 }
      )
    }

    await prisma.rebateRate.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      message: 'Taux de ristourne désactivé avec succès'
    })

  } catch (error: any) {
    logger.error('Erreur lors de la désactivation du taux de ristourne:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


