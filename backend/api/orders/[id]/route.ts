import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

// GET /api/orders/[id] - Récupérer une commande spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true,
                concepteur: true,
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/orders/[id] - Modifier une commande
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, items } = body

    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (status) {
      // Valider les transitions de statut
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.VALIDATED, OrderStatus.CANCELLED],
        [OrderStatus.VALIDATED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
      }

      if (!validTransitions[existingOrder.status].includes(status)) {
        return NextResponse.json({ 
          error: `Cannot change status from ${existingOrder.status} to ${status}` 
        }, { status: 400 })
      }

      updateData.status = status
    }

    if (items) {
      // Mise à jour des articles (si la commande est encore modifiable)
      if (existingOrder.status !== OrderStatus.PENDING) {
        return NextResponse.json({ 
          error: "Cannot modify items of a non-pending order" 
        }, { status: 400 })
      }

      // Supprimer les anciens articles et créer les nouveaux
      await prisma.orderItem.deleteMany({
        where: { orderId: params.id }
      })

      updateData.items = {
        create: items.map((item: any) => ({
          workId: item.workId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true,
                concepteur: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/orders/[id] - Supprimer une commande
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Empêcher la suppression de commandes traitées
    if (![OrderStatus.PENDING, OrderStatus.CANCELLED].includes(existingOrder.status)) {
      return NextResponse.json({ 
        error: "Cannot delete processed orders" 
      }, { status: 400 })
    }

    // Supprimer la commande (les items seront supprimés automatiquement par cascade)
    await prisma.order.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH /api/orders/[id] - Changer le statut d'une commande
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    // Validation
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Valider les transitions de statut
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.VALIDATED, OrderStatus.CANCELLED],
      [OrderStatus.VALIDATED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    }

    if (!validTransitions[existingOrder.status].includes(status)) {
      return NextResponse.json({ 
        error: `Cannot change status from ${existingOrder.status} to ${status}` 
      }, { status: 400 })
    }

    // Mettre à jour le statut
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true,
                concepteur: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}





