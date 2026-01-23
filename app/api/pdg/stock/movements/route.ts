import { logger } from '@/lib/logger'
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
      performedByUser: movement.performedByUser ? {
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
    logger.error('Erreur lors de la récupération des mouvements:', error)
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
    logger.error('Erreur lors de la création du mouvement:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/stock/movements - Modifier un mouvement de stock
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      movementId,
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

    if (!movementId) {
      return NextResponse.json({ 
        error: 'ID du mouvement est requis' 
      }, { status: 400 })
    }

    // Récupérer le mouvement existant
    const existingMovement = await prisma.stockMovement.findUnique({
      where: { id: movementId },
      include: { work: true }
    })

    if (!existingMovement) {
      return NextResponse.json({ 
        error: 'Mouvement non trouvé' 
      }, { status: 404 })
    }

    const targetWorkId = workId || existingMovement.workId
    const targetQuantity = quantity !== undefined ? parseInt(quantity) : existingMovement.quantity
    const targetType = type || existingMovement.type

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: targetWorkId }
    })

    if (!work) {
      return NextResponse.json({ 
        error: 'Œuvre non trouvée' 
      }, { status: 404 })
    }

    // Calculer la différence de quantité pour ajuster le stock
    const quantityDiff = targetQuantity - existingMovement.quantity
    const workIdChanged = workId && workId !== existingMovement.workId

    // Vérifier le stock disponible si c'est une sortie
    if (quantityDiff < 0 && work.stock < Math.abs(quantityDiff)) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Disponible: ${work.stock}, Tentative de retirer: ${Math.abs(quantityDiff)}` 
      }, { status: 400 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Si l'œuvre a changé, annuler l'effet sur l'ancienne œuvre
      if (workIdChanged) {
        await tx.work.update({
          where: { id: existingMovement.workId },
          data: {
            stock: {
              decrement: existingMovement.quantity
            },
            physicalStock: {
              decrement: existingMovement.quantity
            }
          }
        })
      }

      // Mettre à jour le mouvement
      const updatedMovement = await tx.stockMovement.update({
        where: { id: movementId },
        data: {
          workId: targetWorkId,
          type: targetType,
          quantity: targetQuantity,
          reason: reason !== undefined ? reason : existingMovement.reason,
          reference: reference !== undefined ? reference : existingMovement.reference,
          source: source !== undefined ? source : existingMovement.source,
          destination: destination !== undefined ? destination : existingMovement.destination,
          unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existingMovement.unitPrice,
          totalAmount: (unitPrice !== undefined ? parseFloat(unitPrice) : existingMovement.unitPrice || work.price) * Math.abs(targetQuantity),
          partnerId: partnerId !== undefined ? partnerId : existingMovement.partnerId
        },
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

      // Ajuster le stock de la nouvelle œuvre (ou même œuvre si seule la quantité change)
      if (workIdChanged) {
        // Nouvelle œuvre : ajouter la nouvelle quantité
        await tx.work.update({
          where: { id: targetWorkId },
          data: {
            stock: {
              increment: targetQuantity
            },
            physicalStock: {
              increment: targetQuantity
            }
          }
        })
      } else {
        // Même œuvre : ajuster selon la différence
        await tx.work.update({
          where: { id: targetWorkId },
          data: {
            stock: {
              increment: quantityDiff
            },
            physicalStock: {
              increment: quantityDiff
            }
          }
        })
      }

      const updatedWork = await tx.work.findUnique({
        where: { id: targetWorkId }
      })

      return { movement: updatedMovement, updatedWork }
    })

    return NextResponse.json({
      success: true,
      message: 'Mouvement de stock modifié avec succès',
      movement: {
        id: result.movement.id,
        type: result.movement.type,
        quantity: result.movement.quantity,
        reason: result.movement.reason,
        reference: result.movement.reference,
        totalAmount: result.movement.totalAmount,
        createdAt: result.movement.createdAt.toISOString(),
        work: result.movement.work,
        performedByUser: result.movement.performedByUser,
        partner: result.movement.partner
      },
      newStock: result.updatedWork?.stock
    })

  } catch (error: any) {
    logger.error('Erreur lors de la modification du mouvement:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/stock/movements/[id] - Supprimer un mouvement de stock
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const movementId = searchParams.get('id')

    if (!movementId) {
      return NextResponse.json({ 
        error: 'ID du mouvement est requis' 
      }, { status: 400 })
    }

    // Récupérer le mouvement existant
    const existingMovement = await prisma.stockMovement.findUnique({
      where: { id: movementId },
      include: { work: true }
    })

    if (!existingMovement) {
      return NextResponse.json({ 
        error: 'Mouvement non trouvé' 
      }, { status: 404 })
    }

    // Vérifier que l'opération n'est pas trop ancienne (max 7 jours)
    const daysSinceCreation = (Date.now() - existingMovement.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation > 7) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer une opération de plus de 7 jours. Créez une opération de correction à la place.' 
      }, { status: 400 })
    }

    // Vérifier le stock disponible si c'était une entrée (on doit retirer)
    if (existingMovement.quantity > 0) {
      const currentStock = existingMovement.work.stock
      if (currentStock < existingMovement.quantity) {
        return NextResponse.json({ 
          error: `Impossible de supprimer : le stock actuel (${currentStock}) est inférieur à la quantité de l'opération (${existingMovement.quantity}). Veuillez d'abord créer une opération de correction.` 
        }, { status: 400 })
      }
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Annuler l'effet du mouvement sur le stock (retirer ce qui a été ajouté, ou ajouter ce qui a été retiré)
      const stockAdjustment = -existingMovement.quantity // Inverse de la quantité originale

      await tx.work.update({
        where: { id: existingMovement.workId },
        data: {
          stock: {
            increment: stockAdjustment
          },
          physicalStock: {
            increment: stockAdjustment
          }
        }
      })

      // Supprimer le mouvement
      await tx.stockMovement.delete({
        where: { id: movementId }
      })

      const updatedWork = await tx.work.findUnique({
        where: { id: existingMovement.workId }
      })

      return { updatedWork, deletedMovement: existingMovement }
    })

    return NextResponse.json({
      success: true,
      message: 'Mouvement de stock supprimé avec succès',
      deletedMovement: {
        id: result.deletedMovement.id,
        type: result.deletedMovement.type,
        quantity: result.deletedMovement.quantity
      },
      newStock: result.updatedWork?.stock
    })

  } catch (error: any) {
    logger.error('Erreur lors de la suppression du mouvement:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
