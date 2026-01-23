import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/representant/orders - Récupérer les commandes créées par le représentant
export async function GET(request: NextRequest) {
  try {
    logger.debug("🔍 Getting current user...")
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

    logger.debug("✅ User found:", user.name, user.role)

    // Récupérer les commandes créées par le représentant
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

    logger.debug("✅ Orders data prepared:", {
      totalOrders: orders.length,
      summary: response.summary
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error("❌ Error fetching representant orders:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes" },
      { status: 500 }
    )
  }
}

// POST /api/representant/orders - Créer une commande pour un client
export async function POST(request: NextRequest) {
  try {
    logger.debug("🔍 Creating new order for client...")
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
    const { items, clientId, clientName, clientEmail, clientPhone, clientAddress, notes } = body

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

      // Accepter PUBLISHED ou ON_SALE
      if (work.status !== "PUBLISHED" && work.status !== "ON_SALE") {
        return NextResponse.json({ error: `Œuvre ${work.title} n'est pas disponible à la vente` }, { status: 400 })
      }

      if (work.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${work.title}. Disponible: ${work.stock}` }, { status: 400 })
      }
    }

    // Récupérer tous les works pour calculer les prix
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: { id: { in: workIds } }
    })

    // Calculer le total de la commande
    let subtotal = 0
    for (const item of items) {
      const work = works.find(w => w.id === item.workId)
      if (work) {
        const itemPrice = item.price || work.price || 0
        subtotal += itemPrice * item.quantity
      }
    }
    
    const tax = subtotal * 0.18 // TVA à 18%
    const total = subtotal + tax

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: user.id, // Le représentant est le créateur
        status: "PENDING",
        subtotal,
        tax,
        total,
        items: {
          create: items.map((item: any) => {
            const work = works.find(w => w.id === item.workId)
            return {
              workId: item.workId,
              quantity: item.quantity,
              price: item.price || item.workPrice || work?.price || 0
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
                author: true
              }
            }
          }
        }
      }
    })

    // Si un clientId est fourni, mettre à jour les statistiques du client
    if (clientId) {
      try {
        await prisma.client.update({
          where: { id: clientId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
            lastOrder: new Date()
          }
        })
      } catch (clientError) {
        logger.warn("⚠️ Erreur lors de la mise à jour du client:", clientError)
      }
    }

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
            data: JSON.stringify({ 
              orderId: order.id, 
              representantId: user.id, 
              representantName: user.name,
              clientId,
              clientName, 
              clientEmail, 
              clientPhone,
              total: total,
              itemCount: items.length
            })
          }
        })
      }
    } catch (notificationError) {
      logger.warn("⚠️ Failed to create notification:", notificationError)
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

    logger.debug("✅ Order created:", order.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    logger.error("❌ Error creating order:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande: " + error.message },
      { status: 500 }
    )
  }
}

