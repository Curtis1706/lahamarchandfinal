import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET /api/orders - Liste des commandes
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
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
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/orders - Créer une commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, items } = body

    // Validation
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculer le total
    let total = 0
    for (const item of items) {
      const work = await prisma.work.findUnique({
        where: { id: item.workId }
      })
      if (!work) {
        return NextResponse.json({ error: `Work ${item.workId} not found` }, { status: 400 })
      }
      total += work.price * item.quantity
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price || 0
          }))
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
