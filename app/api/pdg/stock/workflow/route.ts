import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// Fonction utilitaire pour récupérer l'IP du client
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// POST /api/pdg/stock/workflow - Exécuter une opération de stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      operationType, // 'ENTRY' ou 'EXIT'
      subType, // 'APPROVISIONNEMENT', 'RETOUR_PARTENAIRE', 'CORRECTION', 'VENTE_DIRECTE', 'DEPOT_PARTENAIRE', 'PERTE', 'TRANSFERT'
      workId,
      quantity,
      source,
      destination,
      partnerId, // Pour les opérations liées aux partenaires
      reason,
      notes,
      unitPrice,
      transferDestinationId // Pour les transferts internes
    } = body

    if (!operationType || !subType || !workId || !quantity || quantity === 0) {
      return NextResponse.json({ 
        error: 'Type d\'opération, sous-type, œuvre et quantité sont requis' 
      }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
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
      }
    })

    if (!work) {
      return NextResponse.json({ 
        error: 'Œuvre non trouvée' 
      }, { status: 404 })
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      let stockMovement
      let updatedWork = work
      let partnerStockUpdate = null

      // Déterminer le type de mouvement et la quantité
      let movementType: any
      let movementQuantity = quantity

      switch (subType) {
        case 'APPROVISIONNEMENT':
          movementType = 'INBOUND'
          break
        case 'RETOUR_PARTENAIRE':
          movementType = 'PARTNER_RETURN'
          break
        case 'CORRECTION':
          movementType = 'CORRECTION'
          break
        case 'VENTE_DIRECTE':
          movementType = 'DIRECT_SALE'
          movementQuantity = -Math.abs(quantity) // Sortie
          break
        case 'DEPOT_PARTENAIRE':
          movementType = 'PARTNER_ALLOCATION'
          movementQuantity = -Math.abs(quantity) // Sortie
          break
        case 'PERTE':
          movementType = 'DAMAGED'
          movementQuantity = -Math.abs(quantity) // Sortie
          break
        case 'TRANSFERT':
          movementType = 'TRANSFER'
          movementQuantity = -Math.abs(quantity) // Sortie du dépôt source
          break
        default:
          throw new Error('Type d\'opération non reconnu')
      }

      // Vérifier le stock disponible pour les sorties
      if (operationType === 'EXIT' && work.stock < Math.abs(movementQuantity)) {
        throw new Error(`Stock insuffisant. Disponible: ${work.stock}, Demandé: ${Math.abs(movementQuantity)}`)
      }

      // Créer le mouvement de stock
      stockMovement = await tx.stockMovement.create({
        data: {
          workId,
          type: movementType,
          quantity: movementQuantity,
          reason: reason || `Opération ${subType}`,
          reference: `${subType}_${workId}_${Date.now()}`,
          source: source || null,
          destination: destination || null,
          unitPrice: unitPrice || work.price,
          totalAmount: (unitPrice || work.price) * Math.abs(quantity),
          performedBy: session.user.id,
          partnerId: partnerId || null,
          isCorrection: subType === 'CORRECTION'
        }
      })

      // Mettre à jour le stock de l'œuvre
      updatedWork = await tx.work.update({
        where: { id: workId },
        data: {
          stock: {
            increment: movementQuantity
          },
          physicalStock: {
            increment: movementQuantity
          }
        }
      })

      // Gérer les opérations spécifiques aux partenaires
      if (partnerId && (subType === 'DEPOT_PARTENAIRE' || subType === 'RETOUR_PARTENAIRE')) {
        // Vérifier que le partenaire existe
        const partner = await tx.partner.findUnique({
          where: { id: partnerId }
        })

        if (!partner) {
          throw new Error('Partenaire non trouvé')
        }

        if (subType === 'DEPOT_PARTENAIRE') {
          // Allocation au partenaire
          const existingPartnerStock = await tx.partnerStock.findFirst({
            where: {
              partnerId: partnerId,
              workId: workId
            }
          })

          if (existingPartnerStock) {
            partnerStockUpdate = await tx.partnerStock.update({
              where: { id: existingPartnerStock.id },
              data: {
                allocatedQuantity: {
                  increment: Math.abs(quantity)
                },
                availableQuantity: {
                  increment: Math.abs(quantity)
                }
              }
            })
          } else {
            partnerStockUpdate = await tx.partnerStock.create({
              data: {
                partnerId: partnerId,
                workId: workId,
                allocatedQuantity: Math.abs(quantity),
                soldQuantity: 0,
                returnedQuantity: 0,
                availableQuantity: Math.abs(quantity)
              }
            })
          }

          // Notifier le partenaire
          await tx.notification.create({
            data: {
              userId: partner.userId,
              title: 'Stock alloué',
              message: `Le PDG vous a alloué ${Math.abs(quantity)} exemplaire(s) de "${work.title}"`,
              type: 'STOCK_ALLOCATION',
              data: JSON.stringify({
                workId: workId,
                workTitle: work.title,
                quantity: Math.abs(quantity)
              })
            }
          })

        } else if (subType === 'RETOUR_PARTENAIRE') {
          // Retour du partenaire
          const partnerStock = await tx.partnerStock.findFirst({
            where: {
              partnerId: partnerId,
              workId: workId
            }
          })

          if (partnerStock) {
            partnerStockUpdate = await tx.partnerStock.update({
              where: { id: partnerStock.id },
              data: {
                returnedQuantity: {
                  increment: Math.abs(quantity)
                },
                availableQuantity: {
                  decrement: Math.abs(quantity)
                }
              }
            })
          }
        }
      }

      // Gérer les transferts internes
      if (subType === 'TRANSFERT' && transferDestinationId) {
        // Créer un mouvement d'entrée pour le dépôt destination
        await tx.stockMovement.create({
          data: {
            workId,
            type: 'TRANSFER',
            quantity: Math.abs(quantity), // Entrée positive
            reason: `Transfert vers ${destination || 'dépôt destination'}`,
            reference: `TRANSFER_IN_${transferDestinationId}_${Date.now()}`,
            source: source || 'Dépôt central',
            destination: destination || transferDestinationId,
            unitPrice: work.price,
            totalAmount: work.price * Math.abs(quantity),
            performedBy: session.user.id
          }
        })
      }

      // Créer une entrée d'audit
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'STOCK_OPERATION',
          performedBy: session.user.id,
          details: JSON.stringify({
            operationType,
            subType,
            workId,
            workTitle: work.title,
            quantity,
            movementId: stockMovement.id,
            partnerId,
            reason,
            notes
          }),
          metadata: JSON.stringify({
            ipAddress: getClientIp(request),
            userAgent: request.headers.get('user-agent') || 'PDG Dashboard'
          })
        }
      })

      return { stockMovement, updatedWork, partnerStockUpdate }
    })

    return NextResponse.json({
      success: true,
      message: 'Opération de stock exécutée avec succès',
      operation: {
        id: result.stockMovement.id,
        type: result.stockMovement.type,
        quantity: result.stockMovement.quantity,
        reason: result.stockMovement.reason,
        reference: result.stockMovement.reference,
        totalAmount: result.stockMovement.totalAmount,
        createdAt: result.stockMovement.createdAt.toISOString()
      },
      work: {
        id: result.updatedWork.id,
        title: result.updatedWork.title,
        newStock: result.updatedWork.stock,
        newPhysicalStock: result.updatedWork.physicalStock
      },
      partnerStock: result.partnerStockUpdate ? {
        id: result.partnerStockUpdate.id,
        allocatedQuantity: result.partnerStockUpdate.allocatedQuantity,
        availableQuantity: result.partnerStockUpdate.availableQuantity
      } : null
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'opération de stock:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/pdg/stock/workflow - Obtenir les statistiques du workflow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = new Date(startDate)
      if (endDate) whereClause.createdAt.lte = new Date(endDate)
    }

    // Statistiques par type d'opération
    const operationStats = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    })

    // Statistiques globales
    const totalMovements = await prisma.stockMovement.count({
      where: whereClause
    })

    const totalInbound = await prisma.stockMovement.aggregate({
      where: {
        ...whereClause,
        quantity: {
          gt: 0
        }
      },
      _sum: {
        quantity: true
      }
    })

    const totalOutbound = await prisma.stockMovement.aggregate({
      where: {
        ...whereClause,
        quantity: {
          lt: 0
        }
      },
      _sum: {
        quantity: true
      }
    })

    return NextResponse.json({
      period: {
        start: startDate,
        end: endDate
      },
      stats: {
        totalMovements,
        totalInbound: totalInbound._sum.quantity || 0,
        totalOutbound: Math.abs(totalOutbound._sum.quantity || 0),
        operations: operationStats.map(op => ({
          type: op.type,
          count: op._count.id,
          totalQuantity: op._sum.quantity || 0
        }))
      }
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
