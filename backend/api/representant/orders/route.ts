import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting current user...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    console.log("✅ User found:", user.name, user.role)

    // Récupérer les commandes du représentant
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const response = {
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            price: item.work.price,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        }))
      })),
      summary: {
        total: orders.length,
        pending: orders.filter(o => o.status === "PENDING").length,
        validated: orders.filter(o => o.status === "VALIDATED").length,
        processing: orders.filter(o => o.status === "PROCESSING").length,
        shipped: orders.filter(o => o.status === "SHIPPED").length,
        delivered: orders.filter(o => o.status === "DELIVERED").length,
        cancelled: orders.filter(o => o.status === "CANCELLED").length
      }
    }

    console.log("✅ Orders data prepared:", {
      totalOrders: orders.length,
      summary: response.summary
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching representant orders:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating new order...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { items, clientName, clientEmail, clientPhone, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items requis" }, { status: 400 })
    }

    // Vérifier que tous les items existent et sont disponibles
    for (const item of items) {
      const work = await prisma.work.findUnique({
        where: { id: item.workId }
      })

      if (!work) {
        return NextResponse.json({ error: `Œuvre ${item.workId} introuvable` }, { status: 400 })
      }

      if (work.status !== "ON_SALE") {
        return NextResponse.json({ error: `Œuvre ${work.title} n'est pas en vente` }, { status: 400 })
      }

      if (work.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${work.title}` }, { status: 400 })
      }
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true
              }
            }
          }
        }
      }
    })

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: "PDG" }
      })

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: "Nouvelle commande à valider",
            message: `Le représentant ${user.name} a créé une nouvelle commande (${order.id}) pour ${clientName || "un client"}`,
            type: "ORDER_UPDATE",
            data: { orderId: order.id, representantId: user.id, clientName, clientEmail, clientPhone, notes }
          }
        })
      }
    } catch (notificationError) {
      console.warn("⚠️ Failed to create notification:", notificationError)
    }

    const response = {
      order: {
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            price: item.work.price,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        }))
      }
    }

    console.log("✅ Order created:", order.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating order:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 }
    )
  }
}
