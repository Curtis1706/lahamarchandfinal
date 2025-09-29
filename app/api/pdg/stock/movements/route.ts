import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/movements - Historique des mouvements de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId') || ''
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const partnerId = searchParams.get('partnerId') || ''

    const whereClause: any = {}

    if (workId) {
      whereClause.workId = workId
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    if (partnerId) {
      whereClause.partnerId = partnerId
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
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
            email: true,
            role: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const movementsData = movements.map(movement => ({
      id: movement.id,
      work: {
        id: movement.work.id,
        title: movement.work.title,
        isbn: movement.work.isbn
      },
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      reference: movement.reference,
      source: movement.source,
      destination: movement.destination,
      unitPrice: movement.unitPrice,
      totalAmount: movement.totalAmount,
      isCorrection: movement.isCorrection,
      correctionReason: movement.correctionReason,
      performedBy: movement.performedByUser ? {
        id: movement.performedByUser.id,
        name: movement.performedByUser.name,
        email: movement.performedByUser.email,
        role: movement.performedByUser.role
      } : null,
      partner: movement.partner ? {
        id: movement.partner.id,
        name: movement.partner.name,
        type: movement.partner.type
      } : null,
      createdAt: movement.createdAt.toISOString()
    }))

    return NextResponse.json({
      movements: movementsData,
      total: movementsData.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des mouvements:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/stock/movements - Créer un mouvement de stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      workId, 
      type, 
      quantity, 
      reason, 
      reference,
      source,
      destination,
      unitPrice,
      partnerId
    } = body

    if (!workId || !type || !quantity || quantity === 0) {
      return NextResponse.json({ 
        error: 'ID de l\'œuvre, type et quantité sont requis' 
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
      // Créer le mouvement
      const movement = await tx.stockMovement.create({
        data: {
          workId,
          type,
          quantity,
          reason: reason || null,
          reference: reference || null,
          source: source || null,
          destination: destination || null,
          unitPrice: unitPrice || work.price,
          totalAmount: (unitPrice || work.price) * Math.abs(quantity),
          performedBy: session.user.id,
          partnerId: partnerId || null
        }
      })

      // Mettre à jour le stock de l'œuvre
      const updatedWork = await tx.work.update({
        where: { id: workId },
        data: {
          stock: {
            increment: quantity
          },
          physicalStock: {
            increment: quantity
          }
        }
      })

      return { movement, updatedWork }
    })

    return NextResponse.json({
      success: true,
      message: 'Mouvement de stock enregistré avec succès',
      movement: {
        id: result.movement.id,
        type: result.movement.type,
        quantity: result.movement.quantity,
        reason: result.movement.reason,
        reference: result.movement.reference,
        totalAmount: result.movement.totalAmount,
        createdAt: result.movement.createdAt.toISOString()
      },
      newStock: result.updatedWork.stock
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création du mouvement:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
