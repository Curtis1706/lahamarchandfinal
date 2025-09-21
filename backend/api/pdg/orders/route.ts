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
    }

    // TODO: Créer une notification pour l'utilisateur quand le modèle Notification sera disponible
    console.log(`📢 Notification à créer: Commande ${orderId} mise à jour vers ${status} pour ${order.user.name}`)

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
