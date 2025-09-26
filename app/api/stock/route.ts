import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { StockMovementType } from "@prisma/client"

// GET /api/stock - Récupérer les données de stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'works', 'movements', 'alerts', 'stats', 'pending'

    switch (type) {
      case 'works':
        // Récupérer tous les livres avec leurs informations de stock
        const works = await prisma.work.findMany({
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true,
            status: true,
            discipline: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            title: 'asc'
          }
        })
        return NextResponse.json(works)

      case 'movements':
        // Récupérer l'historique des mouvements de stock
        const movements = await prisma.stockMovement.findMany({
          select: {
            id: true,
            workId: true,
            work: {
              select: {
                title: true,
                isbn: true
              }
            },
            type: true,
            quantity: true,
            reason: true,
            reference: true,
            createdAt: true,
            performedByUser: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 500 // Limiter à 500 derniers mouvements
        })
        return NextResponse.json(movements)

      case 'alerts':
        // Générer les alertes de stock
        const worksForAlerts = await prisma.work.findMany({
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true,
            discipline: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        const alerts = worksForAlerts
          .map(work => {
            if (work.stock === 0) {
              return {
                id: `alert_${work.id}_out`,
                work,
                type: 'OUT_OF_STOCK' as const,
                message: `Stock épuisé pour "${work.title}"`,
                severity: 'HIGH' as const
              }
            } else if (work.stock <= work.minStock) {
              return {
                id: `alert_${work.id}_low`,
                work,
                type: 'LOW_STOCK' as const,
                message: `Stock faible pour "${work.title}" (${work.stock} restant, minimum: ${work.minStock})`,
                severity: work.stock <= work.minStock / 2 ? 'HIGH' as const : 'MEDIUM' as const
              }
            } else if (work.maxStock && work.stock >= work.maxStock) {
              return {
                id: `alert_${work.id}_excess`,
                work,
                type: 'EXCESS_STOCK' as const,
                message: `Stock excédentaire pour "${work.title}" (${work.stock} en stock, maximum: ${work.maxStock})`,
                severity: 'LOW' as const
              }
            }
            return null
          })
          .filter(Boolean)
          .sort((a, b) => {
            const severityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
            return severityOrder[b!.severity] - severityOrder[a!.severity]
          })

        return NextResponse.json(alerts)

      case 'stats':
        // Calculer les statistiques de stock
        const allWorks = await prisma.work.findMany({
          select: {
            id: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true
          }
        })

        const totalWorks = allWorks.length
        const totalStock = allWorks.reduce((sum, work) => sum + work.stock, 0)
        const totalValue = allWorks.reduce((sum, work) => sum + (work.stock * work.price), 0)
        const lowStockItems = allWorks.filter(work => work.stock > 0 && work.stock <= work.minStock).length
        const outOfStockItems = allWorks.filter(work => work.stock === 0).length
        const excessStockItems = allWorks.filter(work => work.maxStock && work.stock >= work.maxStock).length

        // Calculer le taux de rupture
        const ruptureRate = totalWorks > 0 ? outOfStockItems / totalWorks : 0

        // Calculer le taux de rotation (approximation basée sur les mouvements récents)
        const recentMovements = await prisma.stockMovement.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
            },
            type: 'OUTBOUND'
          },
          select: {
            quantity: true
          }
        })

        const monthlyOutbound = Math.abs(recentMovements.reduce((sum, movement) => sum + movement.quantity, 0))
        const rotationRate = totalStock > 0 ? monthlyOutbound / totalStock : 0

        const stats = {
          totalWorks,
          totalStock,
          totalValue,
          lowStockItems,
          outOfStockItems,
          excessStockItems,
          ruptureRate,
          rotationRate
        }

        return NextResponse.json(stats)

      case 'pending':
        // Pour cet exemple, on retourne des données mockées
        // Dans un vrai système, cela viendrait d'une table de demandes
        
        // Récupérer quelques livres pour créer des opérations mockées
        const pendingWorks = await prisma.work.findMany({
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true
          },
          take: 2
        })

        const pendingOperations = pendingWorks.length > 0 ? [
          {
            id: 'pending_1',
            type: 'RESTOCK',
            work: {
              id: pendingWorks[0].id,
              title: pendingWorks[0].title,
              isbn: pendingWorks[0].isbn,
              price: pendingWorks[0].price,
              stock: pendingWorks[0].stock,
              minStock: pendingWorks[0].minStock,
              maxStock: pendingWorks[0].maxStock
            },
            quantity: 100,
            reason: 'Réapprovisionnement urgent - stock critique',
            requestedBy: {
              name: 'Responsable Stock',
              email: 'stock@lahamarchand.com'
            },
            requestedAt: new Date().toISOString(),
            priority: 'HIGH'
          }
        ] : []

        return NextResponse.json(pendingOperations)

      default:
        return NextResponse.json({ error: "Type parameter required" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching stock data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/stock - Créer un mouvement de stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workId, type, quantity, reason, reference, userId } = body

    // Validation
    if (!workId || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que le livre existe
    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    // Créer le mouvement de stock
    const movement = await prisma.stockMovement.create({
      data: {
        workId,
        type: type as StockMovementType,
        quantity: parseInt(quantity),
        reason,
        reference,
        performedBy: userId
      },
      include: {
        work: {
          select: {
            title: true,
            isbn: true
          }
        },
        performedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Mettre à jour le stock du livre
    const newStock = work.stock + parseInt(quantity)
    await prisma.work.update({
      where: { id: workId },
      data: { stock: Math.max(0, newStock) }
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error("Error creating stock movement:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/stock - Valider une opération en attente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { operationId, approved, userId } = body

    if (!operationId || approved === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Dans un vrai système, on récupérerait l'opération depuis la base
    // Pour cet exemple, on simule la validation
    if (approved) {
      // Créer un mouvement de stock approuvé
      // Cette logique dépendra de votre implémentation spécifique
      console.log(`Operation ${operationId} approved by user ${userId}`)
    } else {
      console.log(`Operation ${operationId} rejected by user ${userId}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: approved ? "Operation approved" : "Operation rejected" 
    })
  } catch (error) {
    console.error("Error validating operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/stock - Supprimer un mouvement (pour correction)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movementId = searchParams.get('id')

    if (!movementId) {
      return NextResponse.json({ error: "Movement ID required" }, { status: 400 })
    }

    // Récupérer le mouvement pour annuler son effet
    const movement = await prisma.stockMovement.findUnique({
      where: { id: movementId },
      include: { work: true }
    })

    if (!movement) {
      return NextResponse.json({ error: "Movement not found" }, { status: 404 })
    }

    // Annuler l'effet du mouvement sur le stock
    const newStock = movement.work.stock - movement.quantity
    await prisma.work.update({
      where: { id: movement.workId },
      data: { stock: Math.max(0, newStock) }
    })

    // Supprimer le mouvement
    await prisma.stockMovement.delete({
      where: { id: movementId }
    })

    return NextResponse.json({ success: true, message: "Movement deleted and stock adjusted" })
  } catch (error) {
    console.error("Error deleting movement:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
