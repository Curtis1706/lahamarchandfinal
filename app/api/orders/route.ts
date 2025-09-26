import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

// GET /api/orders - Liste des commandes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    
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

    // Calculer le total pour chaque commande
    const ordersWithTotal = orders.map(order => ({
      ...order,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      bookCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
    }))

    return NextResponse.json(ordersWithTotal)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/orders - Créer une commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, partnerId, items } = body

    if (!userId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newOrder = await prisma.order.create({
      data: {
        userId,
        partnerId: partnerId || null,
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price
          }))
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

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/orders - Mettre à jour une commande
export async function PUT(request: NextRequest) {
  try {
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

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/orders - Supprimer une commande
export async function DELETE(request: NextRequest) {
  try {
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
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
