import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculatePartnerRebate, calculateAuthorRoyalty } from "@/lib/rebate-calculator"
import { getWorkPrice, validateOrderMinima } from "@/lib/pricing"
import { ClientType } from "@prisma/client"

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
      orderType,
      transactionId,
      paymentProof,
      paymentDueDate
    } = body

    // Utiliser l'ID de la session si userId n'est pas fourni
    const finalUserId = userId || session.user.id

    if (!finalUserId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Au moins un article est requis" }, { status: 400 })
    }

    // Récupérer le type de client de l'utilisateur
    const userWithClient = await prisma.user.findUnique({
      where: { id: finalUserId },
      include: {
        clients: {
          select: { type: true },
          take: 1
        }
      }
    });

    const clientType = userWithClient?.clients[0]?.type || "particulier";

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

    // 🚀 VALIDATION STOCKS AVANT TRANSACTION
    for (const item of items) {
      const work = works.find(w => w.id === item.workId)
      if (work && work.stock < item.quantity) {
        return NextResponse.json({
          error: `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${item.quantity}`
        }, { status: 400 })
      }
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

      // Utiliser le multi-pricing si le prix n'est pas forcé (override)
      const itemPrice = item.price || await getWorkPrice(item.workId, clientType);
      const itemSubtotal = itemPrice * item.quantity
      const itemTax = itemSubtotal * (work.tva !== undefined ? work.tva : 0.18)

      subtotal += itemSubtotal
      tax += itemTax
    }

    const discount = discountAmount || 0
    const total = Math.max(0, subtotal + tax - discount)

    logger.debug(`📦 Création de commande pour l'utilisateur ${finalUserId}`)
    logger.debug(`📦 Items: ${items.length}, Subtotal: ${subtotal}, Tax: ${tax}, Total: ${total}`)

    // 🚀 Validation des minima de commande
    const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const minimaValidation = await validateOrderMinima(clientType, totalQuantity, total);
    if (!minimaValidation.valid) {
      return NextResponse.json({ error: minimaValidation.error }, { status: 400 });
    }

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

    // Résoudre tous les prix avant de créer la commande
    const itemsWithPrices = await Promise.all(items.map(async (item: any) => {
      const work = works.find(w => w.id === item.workId)!

      // 1. Récupérer le prix de référence pour ce type de client (ex: prix grossiste)
      const referencePrice = await getWorkPrice(item.workId, clientType)

      let finalPrice = referencePrice;
      let isOverride = false;

      // 2. Vérifier si un prix spécifique est envoyé (Override)
      if (item.price !== undefined && item.price !== null) {
        const sentPrice = parseFloat(item.price);
        // On considère un override si le prix envoyé est différent du prix de référence (à 0.01 près)
        if (Math.abs(sentPrice - referencePrice) > 0.01) {
          finalPrice = sentPrice;
          isOverride = true;
        }
      }

      return {
        workId: item.workId,
        quantity: item.quantity,
        price: finalPrice,
        originalPrice: referencePrice, // Prix qu'il aurait dû payer
        isPriceOverride: isOverride
      }
    }))

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
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null,
        // Champs de livraison
        deliveryStatus: "PENDING",
        deliveryDate: finalDeliveryDate,
        // Stocker les informations de livraison supplémentaires dans paymentReference temporairement
        // ou créer un champ notes si disponible
        // Pour l'instant, on stocke l'adresse et les heures dans paymentReference (à améliorer avec un modèle dédié)
        paymentReference: JSON.stringify({
          address: deliveryAddress || '',
          timeFrom: deliveryTimeFrom,
          timeTo: deliveryTimeTo,
          orderType: orderType,
          transactionId: transactionId || null,
          paymentProof: paymentProof || null
        }),
        items: {
          create: itemsWithPrices
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

    // 1. Récupérer la commande actuelle AVANT modification
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            work: true
          }
        },
        partner: true,
        user: true
      }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    // 🔹 Logique spécifique Airtel Money Gabon : Si validation, marquer comme payé si preuve fournie
    if (status === "VALIDATED") {
      if (currentOrder.paymentMethod === 'airtel-money-gabon' ||
        currentOrder.paymentMethod === 'mobile_money' ||
        currentOrder.paymentMethod === 'mobile-money'
      ) {
        try {
          const paymentRef = currentOrder.paymentReference ? JSON.parse(currentOrder.paymentReference) : {}
          if (paymentRef.transactionId) {
            updateData.paymentStatus = 'PAID'
            updateData.amountPaid = currentOrder.total
            updateData.remainingAmount = 0
            updateData.fullPaymentDate = new Date()
            logger.info(`💰 Auto-marking Airtel Money order ${id} as PAID upon validation`)
          }
        } catch (e) {
          logger.error(`Error parsing paymentReference for auto-pay:`, e)
        }
      }
    }

    // Préparer les données de mise à jour de base
    const baseUpdateData = {
      status: status as OrderStatus,
      updatedAt: new Date(),
      ...updateData
    }

    // ✨ TRANSACTION START
    // Si la commande passe à VALIDATED, on exécute tout dans une transaction
    if (status === "VALIDATED" && currentOrder.status !== "VALIDATED") {

      try {
        const result = await prisma.$transaction(async (tx) => {

          // A. Vérifier le stock AVANT tout changement
          for (const item of currentOrder.items) {
            // Re-vérifier le stock frais dans la transaction (optional but safe)
            const work = await tx.work.findUnique({ where: { id: item.workId } })
            if (!work) throw new Error(`Œuvre introuvable: ${item.workId}`)

            if (work.stock < item.quantity) {
              throw new Error(`Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${item.quantity}`)
            }
          }

          // B. Mettre à jour la commande
          const updatedOrder = await tx.order.update({
            where: { id },
            data: baseUpdateData,
            include: {
              items: { include: { work: true } },
              user: true,
              partner: true
            }
          })

          // C. Gérer le Bon de Sortie
          // Vérifier qu'un bon de sortie n'existe pas déjà
          const existingDeliveryNote = await tx.deliveryNote.findUnique({
            where: { orderId: id }
          })

          let deliveryNoteReference = existingDeliveryNote?.reference || null

          if (!existingDeliveryNote) {
            // Récupérer l'ID de l'utilisateur (PDG ou session)
            let userId = session?.user?.id
            if (!userId) {
              const pdg = await tx.user.findFirst({ where: { role: 'PDG' }, select: { id: true } })
              userId = pdg?.id
            }

            if (!userId) throw new Error("Impossible d'identifier l'utilisateur pour le bon de sortie")

            // Générer référence
            const year = new Date().getFullYear()
            const count = await tx.deliveryNote.count({
              where: { reference: { startsWith: `BS-${year}-` } }
            })
            const reference = `BS-${year}-${String(count + 1).padStart(4, '0')}`

            // Créer le bon
            await tx.deliveryNote.create({
              data: {
                reference,
                orderId: id,
                generatedById: userId,
                status: 'PENDING'
              }
            })
            deliveryNoteReference = reference

            // D. Mettre à jour les stocks
            for (const item of updatedOrder.items) {
              const work = item.work

              await tx.work.update({
                where: { id: work.id },
                data: {
                  stock: { decrement: item.quantity },
                  physicalStock: { decrement: item.quantity }
                }
              })

              await tx.stockMovement.create({
                data: {
                  workId: work.id,
                  type: 'OUTBOUND',
                  quantity: -item.quantity,
                  reason: `Bon de sortie ${reference} - Commande ${id}`,
                  reference: reference,
                  performedBy: userId,
                  partnerId: updatedOrder.partnerId || null,
                  unitPrice: item.price,
                  totalAmount: item.price * item.quantity
                }
              })
            }
          }

          return { updatedOrder, deliveryNoteReference }
        })

        // E. Post-Transaction : Calculs financiers (Ristournes / Royalties)
        // Ces calculs sont faits après la validation réussie de la commande et du stock
        // On ne bloque pas la transaction pour ça, mais on les traite
        try {
          const { updatedOrder } = result

          // Calculer le ratio de réduction
          // total est le montant net à payer, subtotal le montant brut avant réduction
          let discountRatio = 1
          let effectiveSubtotal = updatedOrder.subtotal || 0

          // Si subtotal est 0 ou invalide, on le recalcule depuis les items
          if (effectiveSubtotal <= 0 && updatedOrder.items && updatedOrder.items.length > 0) {
            effectiveSubtotal = updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          }

          if (effectiveSubtotal > 0) {
            discountRatio = updatedOrder.total / effectiveSubtotal
          }

          // Sécurité : Si un discount est appliqué (ex: subtotal > total), le ratio doit être < 1.
          // Si subtotal < total (ex: taxes ajoutées mais pas de discount affiché dans subtotal), le ratio pourrait être > 1.
          // Mais attention, subtotal est HT et total est TTC-Discount.
          // Si Tax > Discount, Total > Subtotal. Ratio > 1.
          // Si on applique ce ratio > 1, on augmente la commission (base TTC). C'est correct si on commissionne le TTC.
          // Mais si le but est "montant payé", c'est correct.
          // Si Discount est énorme, Total < Subtotal. Ratio < 1. Commission réduite. Correct.

          // Calculer les ristournes partenaires
          if (updatedOrder.partnerId) {
            // On utilise le total net de la commande
            const totalAmount = updatedOrder.total || 0
            const { amount, rate } = await calculatePartnerRebate(id, updatedOrder.partnerId, totalAmount, discountRatio)

            const existingRebate = await prisma.partnerRebate.findFirst({
              where: { orderId: id, partnerId: updatedOrder.partnerId }
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

          // Calculer les droits d'auteur
          for (const item of updatedOrder.items) {
            const work = item.work
            const workWithAuthor = await prisma.work.findUnique({
              where: { id: work.id },
              select: { authorId: true }
            })

            if (workWithAuthor?.authorId) {
              // Calculer le montant de vente net pour cet item
              // Prix unitaire * Quantité * Ratio de réduction
              const saleAmount = item.price * item.quantity * discountRatio

              const { amount, rate } = await calculateAuthorRoyalty(work.id, workWithAuthor.authorId, saleAmount, discountRatio)

              const existingRoyalty = await prisma.royalty.findFirst({
                where: { orderId: id, workId: work.id, userId: workWithAuthor.authorId }
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
          }
        } catch (financialError) {
          logger.error("⚠️ Erreur calculs financiers post-validation:", financialError)
          // On ne fail pas la request car la commande est validée et le stock sorti
        }

        return NextResponse.json({
          ...result.updatedOrder,
          deliveryNoteReference: result.deliveryNoteReference
        })

      } catch (transactionError: any) {
        logger.error("❌ Erreur validation commande (Transaction):", transactionError)
        return NextResponse.json(
          { error: transactionError.message || "Erreur lors de la validation de la commande" },
          { status: 400 } // Bad Request car souvent dû au stock
        )
      }

    } else {
      // Cas mise à jour simple (pas de validation ou déjà validé)
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: baseUpdateData,
        include: {
          items: { include: { work: true } },
          user: true,
          partner: true
        }
      })

      // Si on est déjà validé, on essaie de récupérer le bon de sortie existant pour l'info
      let deliveryNoteReference = null
      if (updatedOrder.status === 'VALIDATED') {
        const dn = await prisma.deliveryNote.findUnique({ where: { orderId: id } })
        deliveryNoteReference = dn?.reference
      }

      return NextResponse.json({
        ...updatedOrder,
        deliveryNoteReference
      })
    }

  } catch (error: any) {
    logger.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 })
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

