import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Construire les filtres
    const where: any = { userId }
    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    // Récupérer les commandes avec pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
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
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ])

    // Formater les données
    const formattedOrders = orders.map(order => ({
      id: order.id,
      date: order.createdAt,
      status: order.status,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        id: item.id,
        title: item.work.title,
        author: item.work.author?.name,
        discipline: item.work.discipline.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        isbn: item.work.isbn
      }))
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error("Error fetching client orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { items } = body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Vérifier que tous les livres existent et sont disponibles
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: { in: ["ON_SALE", "PUBLISHED"] }
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ error: "Some works are not available" }, { status: 400 })
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        items: {
          create: items.map((item: any) => {
            const work = works.find(w => w.id === item.workId)!
            return {
              workId: item.workId,
              quantity: item.quantity,
              price: work.price // Utiliser le prix actuel du livre
            }
          })
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    // Formater la réponse
    const formattedOrder = {
      id: order.id,
      date: order.createdAt,
      status: order.status,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items: order.items.map(item => ({
        id: item.id,
        title: item.work.title,
        author: item.work.author?.name,
        discipline: item.work.discipline.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      }))
    }

    return NextResponse.json(formattedOrder, { status: 201 })

  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH - Modifier une commande (ex: annuler)
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, action } = body

    // Validation
    if (!orderId || !action) {
      return NextResponse.json({ error: "Order ID and action are required" }, { status: 400 })
    }

    // Vérifier que la commande existe et appartient à l'utilisateur
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Traiter l'action
    if (action === "cancel") {
      // Seules les commandes PENDING peuvent être annulées
      if (existingOrder.status !== "PENDING") {
        return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 })
      }

      // Mettre à jour le statut
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          }
        }
      })

      // Formater la réponse
      const formattedOrder = {
        id: updatedOrder.id,
        date: updatedOrder.createdAt,
        status: updatedOrder.status,
        total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        items: updatedOrder.items.map(item => ({
          id: item.id,
          title: item.work.title,
          author: item.work.author?.name,
          discipline: item.work.discipline.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity
        }))
      }

      return NextResponse.json(formattedOrder)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
