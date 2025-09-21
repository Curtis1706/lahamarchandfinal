import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

// GET - Récupérer le suivi des livraisons pour le client
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🚚 Fetching deliveries for user:", user.id)

    // Récupérer toutes les commandes du client avec leurs détails
    const orders = await prisma.order.findMany({
      where: { 
        userId: user.id,
        status: {
          not: "CANCELLED" // Exclure les commandes annulées
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: {
                  select: { name: true }
                }
              }
            }
          }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transformer les données pour le suivi des livraisons
    const deliveries = orders.map(order => {
      const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
      
      // Déterminer le statut de livraison et les étapes
      const deliveryStatus = getDeliveryStatus(order.status)
      const deliverySteps = getDeliverySteps(order.status, order.createdAt)
      
      return {
        id: order.id,
        orderNumber: `#${order.id.slice(-8).toUpperCase()}`,
        status: order.status,
        deliveryStatus,
        deliverySteps,
        createdAt: order.createdAt,
        totalAmount,
        totalItems,
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        })),
        user: order.user
      }
    })

    console.log(`🚚 Found ${deliveries.length} deliveries for user`)

    return NextResponse.json({
      deliveries,
      summary: {
        total: deliveries.length,
        pending: deliveries.filter(d => d.status === "PENDING").length,
        validated: deliveries.filter(d => d.status === "VALIDATED").length,
        processing: deliveries.filter(d => d.status === "PROCESSING").length,
        shipped: deliveries.filter(d => d.status === "SHIPPED").length,
        delivered: deliveries.filter(d => d.status === "DELIVERED").length
      }
    })

  } catch (error) {
    console.error("❌ Error fetching deliveries:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH - Mettre à jour le statut d'une commande (pour les admins)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seuls les PDG et REPRESENTANT peuvent modifier les statuts
    if (!["PDG", "REPRESENTANT"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    // Valider le statut
    const validStatuses = ["PENDING", "VALIDATED", "DELIVERED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: {
                  select: { name: true }
                }
              }
            }
          }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })

    console.log(`🚚 Order ${orderId} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        deliveryStatus: getDeliveryStatus(updatedOrder.status),
        deliverySteps: getDeliverySteps(updatedOrder.status, updatedOrder.createdAt)
      }
    })

  } catch (error) {
    console.error("❌ Error updating order status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Fonction utilitaire pour déterminer le statut de livraison
function getDeliveryStatus(orderStatus: OrderStatus) {
  switch (orderStatus) {
    case "PENDING":
      return {
        current: "En attente de validation",
        progress: 20,
        color: "yellow",
        icon: "⏳"
      }
    case "VALIDATED":
      return {
        current: "Validée",
        progress: 40,
        color: "blue",
        icon: "✅"
      }
    case "PROCESSING":
      return {
        current: "En préparation",
        progress: 60,
        color: "blue",
        icon: "📦"
      }
    case "SHIPPED":
      return {
        current: "Expédiée",
        progress: 80,
        color: "blue",
        icon: "🚚"
      }
    case "DELIVERED":
      return {
        current: "Livrée",
        progress: 100,
        color: "green",
        icon: "✅"
      }
    case "CANCELLED":
      return {
        current: "Annulée",
        progress: 0,
        color: "red",
        icon: "❌"
      }
    default:
      return {
        current: "Statut inconnu",
        progress: 0,
        color: "gray",
        icon: "❓"
      }
  }
}

// Fonction utilitaire pour générer les étapes de livraison
function getDeliverySteps(orderStatus: OrderStatus, createdAt: Date) {
  const steps = [
    {
      id: "ordered",
      title: "Commande passée",
      description: "Votre commande a été enregistrée",
      completed: true,
      date: createdAt,
      icon: "🛒"
    },
    {
      id: "validated",
      title: "Commande validée",
      description: "Paiement confirmé, préparation en cours",
      completed: ["VALIDATED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus),
      date: ["VALIDATED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus) ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null,
      icon: "✅"
    },
    {
      id: "preparing",
      title: "En préparation",
      description: "Vos articles sont en cours de préparation",
      completed: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus),
      date: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(orderStatus) ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000) : null,
      icon: "📦"
    },
    {
      id: "shipped",
      title: "Expédiée",
      description: "Votre commande est en route",
      completed: ["SHIPPED", "DELIVERED"].includes(orderStatus),
      date: ["SHIPPED", "DELIVERED"].includes(orderStatus) ? new Date(createdAt.getTime() + 72 * 60 * 60 * 1000) : null,
      icon: "🚚"
    },
    {
      id: "delivered",
      title: "Livrée",
      description: "Votre commande a été livrée",
      completed: orderStatus === "DELIVERED",
      date: orderStatus === "DELIVERED" ? new Date(createdAt.getTime() + 96 * 60 * 60 * 1000) : null,
      icon: "🏠"
    }
  ]

  return steps
}


