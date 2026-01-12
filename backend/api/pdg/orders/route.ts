import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus } from "@prisma/client"

// GET - Récupérer toutes les commandes (PDG uniquement)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching all orders for PDG:", user.name)

    // Récupérer toutes les commandes avec leurs relations
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        items: {
          include: {
            work: {
              select: { 
                id: true, 
                title: true, 
                isbn: true, 
                price: true,
                discipline: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    console.log("👑 Found orders:", orders.length)

    // Calculer les statistiques
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
      validated: orders.filter(o => o.status === OrderStatus.VALIDATED).length,
      processing: orders.filter(o => o.status === OrderStatus.PROCESSING).length,
      shipped: orders.filter(o => o.status === OrderStatus.SHIPPED).length,
      delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    }

    // Calculer le chiffre d'affaires total
    const totalRevenue = orders
      .filter(order => order.status !== OrderStatus.CANCELLED)
      .reduce((total, order) => {
        return total + order.items.reduce((orderTotal, item) => 
          orderTotal + (item.price * item.quantity), 0
        )
      }, 0)

    console.log(`👑 PDG orders data: ${stats.total} orders, ${totalRevenue} FCFA revenue`)

    return NextResponse.json({
      orders,
      stats,
      totalRevenue,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Mettre à jour le statut d'une commande (PDG uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, status, notes } = body

    if (!orderId || !status) {
      return NextResponse.json({ 
        error: "Missing required fields: orderId, status" 
      }, { status: 400 })
    }

    console.log(`👑 PDG updating order ${orderId} to status:`, status)

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    })

    if (!order) {
      console.error(`❌ Order ${orderId} not found`)
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    // Empêcher la validation d'une commande annulée
    if (status === "VALIDATED" && order.status === "CANCELLED") {
      return NextResponse.json({ 
        error: "Impossible de valider une commande annulée" 
      }, { status: 400 })
    }

    // Vérifier que le statut est valide
    const validStatuses = Object.values(OrderStatus)
    if (!validStatuses.includes(status as OrderStatus)) {
      console.error(`❌ Invalid status: ${status}`)
      return NextResponse.json({ 
        error: `Statut invalide: ${status}. Statuts valides: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Mettre à jour le statut de la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: status as OrderStatus,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        items: {
          include: {
            work: {
              select: { 
                id: true, 
                title: true, 
                isbn: true, 
                price: true,
                discipline: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    // Calculer les royalties si la commande est validée
    if (status === "VALIDATED") {
      try {
        console.log(`💰 Calculating royalties for validated order: ${orderId}`)
        
        // Appeler l'API de calcul des royalties
        const royaltyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/royalties/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({ orderId })
        })

        if (royaltyResponse.ok) {
          const royaltyData = await royaltyResponse.json()
          console.log(`✅ Royalties calculated: ${royaltyData.totalAmount} FCFA`)
        } else {
          console.warn("⚠️ Failed to calculate royalties:", await royaltyResponse.text())
        }
      } catch (royaltyError) {
        console.warn("⚠️ Error calculating royalties:", royaltyError)
        // Ne pas faire échouer la mise à jour de commande si le calcul des royalties échoue
      }

      // 🔹 Créer automatiquement un Bon de Sortie et réduire le stock
      try {
        console.log(`📦 Creating delivery note and reducing stock for order: ${orderId}`)
        
        // Vérifier qu'un bon de sortie n'existe pas déjà
        const existingDeliveryNote = await prisma.deliveryNote.findUnique({
          where: { orderId }
        })

        if (existingDeliveryNote) {
          console.log(`⚠️ Delivery note already exists for order ${orderId}`)
        } else {
          // Récupérer la commande avec ses items
          const orderWithItems = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  work: true
                }
              }
            }
          })

          if (!orderWithItems) {
            throw new Error(`Order ${orderId} not found`)
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
                orderId,
                generatedById: user.id,
                status: 'PENDING'
              }
            })

            console.log(`✅ Delivery note created: ${reference}`)

            // 3. Réduire le stock pour chaque item et créer des mouvements de stock
            for (const item of orderWithItems.items) {
              const work = item.work
              const quantity = item.quantity

              // Vérifier que le stock est suffisant
              if (work.stock < quantity) {
                throw new Error(
                  `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${quantity}`
                )
              }

              // Réduire le stock
              await tx.work.update({
                where: { id: work.id },
                data: {
                  stock: {
                    decrement: quantity
                  },
                  physicalStock: {
                    decrement: quantity
                  }
                }
              })

              // Créer un mouvement de stock pour tracer l'historique
              await tx.stockMovement.create({
                data: {
                  workId: work.id,
                  type: 'OUTBOUND',
                  quantity: -quantity, // Négatif car c'est une sortie
                  reason: `Bon de sortie ${reference} - Commande ${orderId}`,
                  reference: reference,
                  performedBy: user.id,
                  partnerId: orderWithItems.partnerId || null,
                  unitPrice: item.price,
                  totalAmount: item.price * quantity
                }
              })

              console.log(`✅ Stock reduced for "${work.title}": -${quantity} (new stock: ${work.stock - quantity})`)
            }

            console.log(`✅ Delivery note ${reference} created and stock reduced for order ${orderId}`)
          })
        }
      } catch (deliveryNoteError: any) {
        console.error("❌ Error creating delivery note or reducing stock:", deliveryNoteError)
        // Ne pas faire échouer la validation si la création du bon échoue
        // Mais on log l'erreur pour investigation
        console.warn("⚠️ Order validated but delivery note creation failed:", deliveryNoteError.message)
      }
    }

    // Créer une notification pour le client
    try {
      const statusMessages: Record<string, {title: string, message: string}> = {
        'VALIDATED': {
          title: '✅ Commande validée',
          message: `Votre commande ${orderId} a été validée et est en cours de traitement.`
        },
        'PROCESSING': {
          title: '📦 Commande en préparation',
          message: `Votre commande ${orderId} est en cours de préparation.`
        },
        'SHIPPED': {
          title: '🚚 Commande expédiée',
          message: `Votre commande ${orderId} a été expédiée et sera livrée prochainement.`
        },
        'DELIVERED': {
          title: '✅ Commande livrée',
          message: `Votre commande ${orderId} a été livrée avec succès. Merci pour votre confiance !`
        },
        'CANCELLED': {
          title: '❌ Commande annulée',
          message: `Votre commande ${orderId} a été annulée.`
        }
      }

      const notifContent = statusMessages[status] || {
        title: 'Mise à jour de commande',
        message: `Votre commande ${orderId} a été mise à jour.`
      }

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: notifContent.title,
          message: notifContent.message,
          type: "ORDER_STATUS_CHANGED",
          data: JSON.stringify({
            orderId: order.id,
            newStatus: status,
            updatedBy: 'PDG',
            updatedAt: new Date().toISOString()
          })
        }
      })
      console.log(`✅ Notification créée pour ${order.user.name}`)
    } catch (notifError) {
      console.error("⚠️ Erreur création notification:", notifError)
    }

    console.log(`✅ Order ${orderId} updated to ${status}`)

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Commande ${orderId} mise à jour vers le statut: ${status}`
    })

  } catch (error) {
    console.error("❌ Error updating PDG order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
