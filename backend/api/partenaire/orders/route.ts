import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    console.log("🏢 Getting partner orders...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un partenaire
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== Role.PARTENAIRE) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les informations du partenaire
    const partner = await prisma.partner.findUnique({
      where: { userId: user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: "Partenaire introuvable" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construire les filtres
    const where: any = { partnerId: partner.id }
    if (status) where.status = status

    // Récupérer les commandes
    const orders = await prisma.order.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit
    })

    const response = {
      orders: orders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + item.price, 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          amount: item.price,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            price: item.work.price,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          }
        }))
      }))
    }

    console.log("✅ Partner orders prepared:", {
      ordersCount: orders.length,
      partnerName: partner.name
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching partner orders:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏢 Creating partner order...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un partenaire
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== Role.PARTENAIRE) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les informations du partenaire
    const partner = await prisma.partner.findUnique({
      where: { userId: user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: "Partenaire introuvable" }, { status: 404 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items requis" }, { status: 400 })
    }

    // Vérifier que toutes les œuvres existent et sont disponibles
    const workIds = items.map(item => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: "ON_SALE"
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ error: "Certaines œuvres ne sont pas disponibles" }, { status: 400 })
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        partnerId: partner.id,
        status: OrderStatus.PENDING,
        items: {
          create: items.map(item => {
            const work = works.find(w => w.id === item.workId)!
            return {
              workId: item.workId,
              quantity: item.quantity,
              price: work.price * item.quantity
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

    const response = {
      order: {
        id: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + item.price, 0),
        itemCount: order.items.length,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          amount: item.price,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            price: item.work.price,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          }
        }))
      }
    }

    console.log("✅ Partner order created:", order.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating partner order:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 }
    )
  }
}
