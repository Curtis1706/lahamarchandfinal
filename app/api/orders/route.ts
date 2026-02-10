import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculatePartnerRebate, calculateAuthorRoyalty } from "@/lib/rebate-calculator"

// GET /api/orders - Liste des commandes
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}

    // Sécurité : Les non-PDG ne voient que leurs propres commandes
    if (session.user.role !== 'PDG') {
      whereClause.userId = session.user.id
    }

    if (status && status !== 'all') {
      whereClause.status = status as OrderStatus
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                tva: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculer le total pour chaque commande et inclure les nouveaux champs
    const ordersWithTotal = orders.map(order => ({
      ...order,
      bookCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      // S'assurer que les champs de paiement et livraison sont inclus
      paymentType: order.paymentType || 'CASH',
      paymentStatus: order.paymentStatus || 'UNPAID',
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference, // Inclure paymentReference pour l'adresse de livraison
      amountPaid: order.amountPaid || 0,
      remainingAmount: order.remainingAmount || 0,
      depositAmount: order.depositAmount,
      depositDate: order.depositDate,
      fullPaymentDate: order.fullPaymentDate,
      deliveryDate: order.deliveryDate,
      deliveryStatus: order.deliveryStatus || 'PENDING',
      receivedAt: order.receivedAt,
      receivedBy: order.receivedBy
    }))

    return NextResponse.json(ordersWithTotal)
  } catch (error) {
    logger.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/orders - Créer une commande
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      partnerId,
      items,
      promoCode,
      discountAmount,
      deliveryDate,
      deliveryAddress,
      deliveryTimeFrom,
      deliveryTimeTo,
      paymentMethod,
      orderType
    } = body

    // Utiliser l'ID de la session si userId n'est pas fourni
    const finalUserId = userId || session.user.id

    if (!finalUserId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Au moins un article est requis" }, { status: 400 })
    }

    // Vérifier que tous les items ont les champs requis
    for (const item of items) {
      if (!item.workId) {
        return NextResponse.json({
          error: `workId manquant pour l'article: ${JSON.stringify(item)}`
        }, { status: 400 })
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json({
          error: `Quantité invalide pour l'article ${item.workId}`
        }, { status: 400 })
      }
    }

    // Vérifier que tous les œuvres existent et sont disponibles
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds }
      },
      select: {
        id: true,
        title: true,
        price: true,
        tva: true,
        status: true,
        stock: true
      }
    })

    if (works.length !== workIds.length) {
      const foundIds = works.map(w => w.id)
      const missingIds = workIds.filter(id => !foundIds.includes(id))
      return NextResponse.json({
        error: `Œuvres introuvables: ${missingIds.join(', ')}`
      }, { status: 400 })
    }

    // Vérifier que les œuvres sont en vente
    const unavailableWorks = works.filter(w => w.status !== 'ON_SALE' && w.status !== 'PUBLISHED')
    if (unavailableWorks.length > 0) {
      return NextResponse.json({
        error: `Certaines œuvres ne sont pas disponibles: ${unavailableWorks.map(w => w.title).join(', ')}`
      }, { status: 400 })
    }

    // Calculer le total de la commande avec la TVA spécifique de chaque œuvre
    let subtotal = 0
    let tax = 0
    for (const item of items) {
      const work = works.find(w => w.id === item.workId)
      if (!work) {
        return NextResponse.json({
          error: `Œuvre ${item.workId} introuvable`
        }, { status: 400 })
      }
      const itemPrice = item.price || work.price || 0
      const itemSubtotal = itemPrice * item.quantity
      const itemTax = itemSubtotal * (work.tva !== undefined ? work.tva : 0.18)

      subtotal += itemSubtotal
      tax += itemTax
    }

    const discount = discountAmount || 0
    const total = Math.max(0, subtotal + tax - discount)

    logger.debug(`📦 Création de commande pour l'utilisateur ${finalUserId}`)
    logger.debug(`📦 Items: ${items.length}, Subtotal: ${subtotal}, Tax: ${tax}, Total: ${total}`)

    // Préparer la date de livraison avec les heures si fournies
    let finalDeliveryDate: Date | null = null
    if (deliveryDate) {
      try {
        const date = new Date(deliveryDate)
        // Si des heures sont fournies, on peut les combiner avec la date
        // Pour l'instant, on utilise juste la date
        finalDeliveryDate = date
      } catch (e) {
        logger.warn("Erreur lors du parsing de la date de livraison:", e)
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        userId: finalUserId,
        partnerId: partnerId || null,
        subtotal,
        tax,
        total,
        discount: discount || 0,
        promoCode: promoCode || null,
        status: "PENDING",
        // Champs de paiement
        paymentType: "CASH", // Par défaut: paiement comptant
        paymentStatus: "UNPAID",
        amountPaid: 0,
        remainingAmount: total,
        paymentMethod: paymentMethod || null,
        // Champs de livraison
        deliveryStatus: "PENDING",
        deliveryDate: finalDeliveryDate,
        // Stocker les informations de livraison supplémentaires dans paymentReference temporairement
        // ou créer un champ notes si disponible
        // Pour l'instant, on stocke l'adresse et les heures dans paymentReference (à améliorer avec un modèle dédié)
        paymentReference: deliveryAddress ? JSON.stringify({
          address: deliveryAddress,
          timeFrom: deliveryTimeFrom,
          timeTo: deliveryTimeTo,
          orderType: orderType
        }) : null,
        items: {
          create: items.map((item: any) => {
            const work = works.find(w => w.id === item.workId)!
            return {
              workId: item.workId,
              quantity: item.quantity,
              price: item.price || work.price || 0
            }
          })
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    logger.debug(`✅ Commande créée avec succès: ${newOrder.id}`)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error: any) {
    logger.error("❌ Error creating order:", error)
    logger.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json({
      error: error.message || "Erreur lors de la création de la commande",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// PUT /api/orders - Mettre à jour une commande
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut modifier les commandes
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        updatedAt: new Date(),
        ...updateData
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                stock: true,
                physicalStock: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // 🔹 Créer automatiquement un Bon de Sortie et réduire le stock si la commande est validée
    if (status === "VALIDATED") {
      try {
        // Vérifier qu'un bon de sortie n'existe pas déjà
        const existingDeliveryNote = await prisma.deliveryNote.findUnique({
          where: { orderId: id }
        })

        if (!existingDeliveryNote) {
          // Récupérer l'ID de l'utilisateur (PDG ou utilisateur de la session)
          let userId = session?.user?.id
          if (!userId) {
            // Si pas de session, trouver le PDG
            const pdg = await prisma.user.findFirst({
              where: { role: 'PDG' },
              select: { id: true }
            })
            if (pdg) {
              userId = pdg.id
            } else {
              throw new Error("Aucun utilisateur PDG trouvé pour créer le bon de sortie")
            }
          }

          // Utiliser une transaction pour garantir la cohérence
          await prisma.$transaction(async (tx) => {
            // 1. Générer une référence unique pour le bon de sortie
            const year = new Date().getFullYear()
            const count = await tx.deliveryNote.count({
              where: {
                reference: {
                  startsWith: `BS-${year}-`
                }
              }
            })
            const reference = `BS-${year}-${String(count + 1).padStart(4, '0')}`

            // 2. Créer le bon de sortie
            const deliveryNote = await tx.deliveryNote.create({
              data: {
                reference,
                orderId: id,
                generatedById: userId,
                status: 'PENDING'
              }
            })

            // 3. Réduire le stock pour chaque item et créer des mouvements de stock
            for (const item of updatedOrder.items) {
              const work = item.work
              const quantity = item.quantity

              // Vérifier que le stock est suffisant
              if (work.stock < quantity) {
                throw new Error(
                  `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${quantity}`
                )
              }

              // Réduire le stock
              const updatedWork = await tx.work.update({
                where: { id: work.id },
                data: {
                  stock: {
                    decrement: quantity
                  },
                  physicalStock: {
                    decrement: quantity
                  }
                },
                select: {
                  stock: true,
                  physicalStock: true
                }
              })

              // Créer un mouvement de stock pour tracer l'historique
              await tx.stockMovement.create({
                data: {
                  workId: work.id,
                  type: 'OUTBOUND',
                  quantity: -quantity, // Négatif car c'est une sortie
                  reason: `Bon de sortie ${reference} - Commande ${id}`,
                  reference: reference,
                  performedBy: userId,
                  partnerId: updatedOrder.partnerId || null,
                  unitPrice: item.price,
                  totalAmount: item.price * quantity
                }
              })
            }
          })
        }

        // 🔹 Calculer automatiquement les ristournes si la commande est validée
        try {
          // Calculer les ristournes partenaires si c'est une commande partenaire
          if (updatedOrder.partnerId && updatedOrder.partner) {
            const totalAmount = updatedOrder.total || updatedOrder.subtotal || 0
            const { amount, rate } = await calculatePartnerRebate(
              id,
              updatedOrder.partnerId,
              totalAmount
            )

            // Vérifier si une ristourne existe déjà
            const existingRebate = await prisma.partnerRebate.findFirst({
              where: {
                orderId: id,
                partnerId: updatedOrder.partnerId
              }
            })

            if (!existingRebate) {
              await prisma.partnerRebate.create({
                data: {
                  partnerId: updatedOrder.partnerId,
                  orderId: id,
                  amount,
                  rate,
                  status: 'PENDING'
                }
              })
            }
          }

          // Calculer les droits d'auteur pour chaque item
          for (const item of updatedOrder.items) {
            const work = item.work
            if (!work) continue

            // Récupérer l'auteur de l'œuvre
            const workWithAuthor = await prisma.work.findUnique({
              where: { id: work.id },
              select: { authorId: true }
            })

            if (!workWithAuthor?.authorId) continue

            const saleAmount = item.price * item.quantity
            const { amount, rate } = await calculateAuthorRoyalty(
              work.id,
              workWithAuthor.authorId,
              saleAmount
            )

            // Vérifier si une royalty existe déjà
            const existingRoyalty = await prisma.royalty.findFirst({
              where: {
                orderId: id,
                workId: work.id,
                userId: workWithAuthor.authorId
              }
            })

            if (!existingRoyalty) {
              await prisma.royalty.create({
                data: {
                  workId: work.id,
                  userId: workWithAuthor.authorId,
                  orderId: id,
                  amount,
                  rate,
                  paid: false
                }
              })
            }
          }
        } catch (rebateError: any) {
          logger.error("❌ Error calculating rebates:", rebateError)
          logger.warn("⚠️ Order validated but rebate calculation failed:", rebateError.message)
        }
      } catch (deliveryNoteError: any) {
        logger.error("❌❌ Error creating delivery note or reducing stock:", deliveryNoteError)
        logger.error("❌❌ Error stack:", deliveryNoteError.stack)
        // Ne pas faire échouer la validation si la création du bon échoue
        // Mais on log l'erreur pour investigation
        logger.warn("⚠️⚠️ Order validated but delivery note creation failed:", deliveryNoteError.message)
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    logger.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/orders - Supprimer une commande
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut supprimer les commandes
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Supprimer d'abord les items de la commande
    await prisma.orderItem.deleteMany({
      where: { orderId }
    })

    // Puis supprimer la commande
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    logger.error("Error deleting order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
