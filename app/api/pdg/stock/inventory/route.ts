import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/inventory - Obtenir l'état actuel du stock pour inventaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const discipline = searchParams.get('discipline') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    const whereClause: any = {
      status: 'PUBLISHED' // Seules les œuvres publiées sont inventoriées
    }

    if (discipline && discipline !== 'all') {
      whereClause.discipline = {
        name: { contains: discipline, mode: 'insensitive' }
      }
    }

    if (lowStock) {
      whereClause.stock = {
        lte: prisma.work.fields.minStock
      }
    }

    const works = await prisma.work.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            name: true
          }
        },
        discipline: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { discipline: { name: 'asc' } },
        { title: 'asc' }
      ]
    })

    const inventoryData = works.map(work => ({
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      internalCode: work.internalCode,
      discipline: work.discipline?.name || 'Non définie',
      author: work.author?.name || 'Auteur inconnu',
      systemStock: work.stock,
      physicalStock: work.physicalStock,
      minStock: work.minStock,
      maxStock: work.maxStock,
      price: work.price,
      difference: work.physicalStock - work.stock,
      isLowStock: work.stock <= work.minStock,
      needsAdjustment: Math.abs(work.physicalStock - work.stock) > 0
    }))

    // Calculer les statistiques
    const totalSystemStock = inventoryData.reduce((sum, item) => sum + item.systemStock, 0)
    const totalPhysicalStock = inventoryData.reduce((sum, item) => sum + item.physicalStock, 0)
    const totalDifference = totalPhysicalStock - totalSystemStock
    const itemsNeedingAdjustment = inventoryData.filter(item => item.needsAdjustment).length
    const lowStockItems = inventoryData.filter(item => item.isLowStock).length

    return NextResponse.json({
      inventory: inventoryData,
      stats: {
        totalItems: inventoryData.length,
        totalSystemStock,
        totalPhysicalStock,
        totalDifference,
        itemsNeedingAdjustment,
        lowStockItems
      }
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/stock/inventory - Appliquer les ajustements d'inventaire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { adjustments, inventoryNotes } = body

    if (!adjustments || !Array.isArray(adjustments)) {
      return NextResponse.json({ 
        error: 'Liste d\'ajustements requise' 
      }, { status: 400 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const results = await prisma.$transaction(async (tx) => {
      const processedAdjustments = []

      for (const adjustment of adjustments) {
        const { workId, physicalStock, notes } = adjustment

        if (!workId || physicalStock === undefined) {
          continue
        }

        // Récupérer l'œuvre actuelle
        const work = await tx.work.findUnique({
          where: { id: workId }
        })

        if (!work) {
          continue
        }

        // Calculer la différence
        const difference = physicalStock - work.stock

        // Mettre à jour le stock
        const updatedWork = await tx.work.update({
          where: { id: workId },
          data: {
            stock: physicalStock,
            physicalStock: physicalStock
          }
        })

        // Créer un mouvement d'inventaire si il y a une différence
        if (difference !== 0) {
          await tx.stockMovement.create({
            data: {
              workId,
              type: 'INVENTORY',
              quantity: difference,
              reason: `Ajustement inventaire - ${notes || 'Non spécifié'}`,
              reference: `INVENTORY_${workId}_${Date.now()}`,
              performedBy: session.user.id,
              source: 'Inventaire PDG',
              isCorrection: false,
              correctionReason: null
            }
          })
        }

        processedAdjustments.push({
          workId,
          workTitle: work.title,
          oldStock: work.stock,
          newStock: physicalStock,
          difference,
          notes
        })
      }

      // Créer une entrée d'audit pour l'inventaire
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'INVENTORY_ADJUSTMENT',
          details: JSON.stringify({
            totalAdjustments: processedAdjustments.length,
            adjustments: processedAdjustments,
            inventoryNotes
          }),
          ipAddress: '127.0.0.1', // TODO: Récupérer la vraie IP
          userAgent: 'PDG Dashboard'
        }
      })

      return processedAdjustments
    })

    return NextResponse.json({
      success: true,
      message: 'Ajustements d\'inventaire appliqués avec succès',
      processedAdjustments: results.length,
      adjustments: results
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'ajustement d\'inventaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

