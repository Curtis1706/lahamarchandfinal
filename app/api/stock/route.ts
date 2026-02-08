import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StockMovementType } from "@prisma/client"
import { calculateAvailableStock } from "@/lib/partner-stock"

export const dynamic = 'force-dynamic'

// GET /api/stock - Récupérer les données de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux données de stock
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

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
            publicationDate: true,
            version: true,
            discipline: {
              select: {
                id: true,
                name: true
              }
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            project: {
              select: {
                id: true,
                title: true
              }
            }
          },
          where: {
            status: 'PUBLISHED' // Seules les œuvres publiées apparaissent dans le stock
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
        // Générer et créer les alertes de stock persistantes
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

        // Créer ou mettre à jour les alertes dans la base de données
        // 1. Récupérer tous les workIds
        const workIds = worksForAlerts.map(w => w.id)

        // 2. Charger TOUS les alerts existants non résolus en 1 requête
        const existingAlerts = await prisma.stockAlert.findMany({
          where: {
            workId: { in: workIds },
            isResolved: false
          }
        })

        // 3. Créer un Set pour lookup rapide
        const existingAlertsSet = new Set(
          existingAlerts.map(a => `${a.workId}-${a.type}`)
        )

        // 4. Préparer les nouvelles alertes à créer (en JavaScript, pas de DB)
        const newAlerts: Array<{
          workId: string
          type: string
          severity: string
          title: string
          message: string
        }> = []

        // 5. Collecter les workIds à résoudre par type d'alerte
        const stockOutWorkIdsToResolve: string[] = []
        const stockLowWorkIdsToResolve: string[] = []

        // 6. Parcourir les works et déterminer quelles alertes créer/résoudre
        for (const work of worksForAlerts) {
          if (work.stock === 0) {
            // Vérifier si une alerte STOCK_OUT existe déjà
            const alertKey = `${work.id}-STOCK_OUT`
            if (!existingAlertsSet.has(alertKey)) {
              newAlerts.push({
                workId: work.id,
                type: 'STOCK_OUT',
                severity: 'ERROR',
                title: `Stock épuisé - ${work.title}`,
                message: `Stock épuisé pour "${work.title}"`
              })
            }
          } else {
            // Résoudre les alertes de stock épuisé si le stock est maintenant > 0
            const stockOutAlertKey = `${work.id}-STOCK_OUT`
            if (existingAlertsSet.has(stockOutAlertKey)) {
              stockOutWorkIdsToResolve.push(work.id)
            }

            // Gérer les alertes de stock faible
            if (work.stock <= work.minStock) {
              const stockLowAlertKey = `${work.id}-STOCK_LOW`
              if (!existingAlertsSet.has(stockLowAlertKey)) {
                newAlerts.push({
                  workId: work.id,
                  type: 'STOCK_LOW',
                  severity: work.stock <= work.minStock / 2 ? 'ERROR' : 'WARNING',
                  title: `Stock faible - ${work.title}`,
                  message: `Stock faible pour "${work.title}" (${work.stock} restant, minimum: ${work.minStock})`
                })
              }
            } else {
              // Résoudre les alertes de stock faible si le stock est maintenant au-dessus du minimum
              const stockLowAlertKey = `${work.id}-STOCK_LOW`
              if (existingAlertsSet.has(stockLowAlertKey)) {
                stockLowWorkIdsToResolve.push(work.id)
              }
            }
          }
        }

        // 7. Résoudre les alertes en batch (groupées par type)
        const resolvePromises: Promise<any>[] = []

        if (stockOutWorkIdsToResolve.length > 0) {
          resolvePromises.push(
            prisma.stockAlert.updateMany({
              where: {
                workId: { in: stockOutWorkIdsToResolve },
                type: 'STOCK_OUT',
                isResolved: false
              },
              data: {
                isResolved: true,
                resolvedAt: new Date()
              }
            })
          )
        }

        if (stockLowWorkIdsToResolve.length > 0) {
          resolvePromises.push(
            prisma.stockAlert.updateMany({
              where: {
                workId: { in: stockLowWorkIdsToResolve },
                type: 'STOCK_LOW',
                isResolved: false
              },
              data: {
                isResolved: true,
                resolvedAt: new Date()
              }
            })
          )
        }

        // Exécuter les résolutions en parallèle
        await Promise.all(resolvePromises)

        // 8. Créer toutes les nouvelles alertes en 1 requête
        if (newAlerts.length > 0) {
          await prisma.stockAlert.createMany({
            data: newAlerts,
            skipDuplicates: true
          })
        }

        // Récupérer toutes les alertes non résolues pour les retourner
        const activeAlerts = await prisma.stockAlert.findMany({
          where: {
            isResolved: false
          },
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                stock: true,
                minStock: true,
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' }
          ]
        })

        // Formater les alertes pour la compatibilité avec le frontend
        const formattedAlerts = activeAlerts.map(alert => ({
          id: alert.id,
          work: alert.work,
          type: alert.type === 'STOCK_OUT' ? 'OUT_OF_STOCK' : alert.type === 'STOCK_LOW' ? 'LOW_STOCK' : 'EXCESS_STOCK',
          message: alert.message,
          severity: alert.severity === 'ERROR' ? 'HIGH' : alert.severity === 'WARNING' ? 'MEDIUM' : 'LOW'
        }))

        return NextResponse.json(formattedAlerts)

      case 'stats':
        // Calculer les statistiques de stock
        const allWorks = await prisma.work.findMany({
          select: {
            id: true,
            price: true,
            stock: true,
            physicalStock: true,
            minStock: true,
            maxStock: true
          }
        })

        // Calculer le stock en dépôt
        // Stock en dépôt = livres confiés aux partenaires/libraires/représentants
        // qui n'ont pas encore été vendus (dépôt-vente)
        // C'est le stock qui a quitté l'entrepôt principal mais appartient toujours à LahaMarchand
        const partnerStocks = await prisma.partnerStock.findMany({
          select: {
            allocatedQuantity: true,
            soldQuantity: true,
            returnedQuantity: true
          }
        })
        // Calculer availableQuantity: allocated - sold + returned
        const totalDepot = partnerStocks.reduce((sum, ps) => {
          const available = calculateAvailableStock(
            ps.allocatedQuantity,
            ps.soldQuantity,
            ps.returnedQuantity
          )
          return sum + available
        }, 0)

        const totalWorks = allWorks.length
        // En stock = livres dans l'entrepôt principal (disponibles pour vente immédiate)
        const totalStock = allWorks.reduce((sum, work) => sum + work.stock, 0)
        // Total = En stock (entrepôt) + En dépôt (partenaires)
        const totalPhysicalStock = totalStock + totalDepot
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
          totalPhysicalStock,
          totalDepot,
          totalValue,
          lowStockItems,
          outOfStockItems,
          excessStockItems,
          ruptureRate,
          rotationRate
        }

        return NextResponse.json(stats)

      case 'pending':
        // Récupérer les vraies demandes de stock depuis la base de données
        const stockRequests = await prisma.stockRequest.findMany({
          where: {
            status: 'PENDING'
          },
          include: {
            requestedBy: {
              select: {
                name: true,
                email: true
              }
            },
            items: {
              include: {
                work: {
                  select: {
                    id: true,
                    title: true,
                    isbn: true,
                    price: true,
                    stock: true,
                    minStock: true,
                    maxStock: true
                  }
                }
              }
            }
          },
          orderBy: [
            {
              createdAt: 'asc' // Plus anciennes en premier
            }
          ]
        })

        const pendingOperations = stockRequests.flatMap(request =>
          request.items.map(item => ({
            id: `${request.id}-${item.id}`,
            requestId: request.id,
            type: request.type,
            work: item.work,
            quantity: item.quantity,
            reason: request.notes || `Demande de stock - ${request.type}`,
            requestedBy: {
              name: request.requestedBy.name,
              email: request.requestedBy.email
            },
            requestedAt: request.createdAt.toISOString(),
            priority: 'MEDIUM', // Par défaut, le modèle existant n'a pas de priorité
            notes: request.notes
          }))
        )

        return NextResponse.json(pendingOperations)

      default:
        return NextResponse.json({ error: "Type parameter required" }, { status: 400 })
    }
  } catch (error) {
    logger.error("Error fetching stock data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/stock - Créer un mouvement de stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

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
    logger.error("Error creating stock movement:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/stock - Valider une opération en attente
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

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
      logger.debug(`Operation ${operationId} approved by user ${userId}`)
    } else {
      logger.debug(`Operation ${operationId} rejected by user ${userId}`)
    }

    return NextResponse.json({
      success: true,
      message: approved ? "Operation approved" : "Operation rejected"
    })
  } catch (error) {
    logger.error("Error validating operation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/stock - Supprimer un mouvement (pour correction)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

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
    logger.error("Error deleting movement:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
