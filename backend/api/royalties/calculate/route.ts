import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus } from "@prisma/client"

// POST - Calculer et créer les royalties pour une commande
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seuls les PDG et les représentants peuvent déclencher le calcul des royalties
    if (!["PDG", "REPRESENTANT"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - PDG or REPRESENTANT role required" }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: "Missing required field: orderId" }, { status: 400 })
    }

    console.log(`💰 Calculating royalties for order: ${orderId}`)

    // Récupérer la commande avec ses items et les œuvres
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            work: {
              include: {
                author: true,
                discipline: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Vérifier que la commande est validée (pas annulée)
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot calculate royalties for cancelled order" }, { status: 400 })
    }

    const royaltyRate = 0.15 // 15% de royalty pour l'auteur
    const createdRoyalties = []

    // Calculer les royalties pour chaque item de la commande
    for (const item of order.items) {
      const work = item.work
      const author = work.author

      if (!author) {
        console.log(`⚠️ Work ${work.id} has no author, skipping royalty calculation`)
        continue
      }

      // Calculer le montant de la royalty
      const royaltyAmount = item.price * item.quantity * royaltyRate

      // Vérifier si une royalty existe déjà pour cette commande et cette œuvre
      const existingRoyalty = await prisma.royalty.findFirst({
        where: {
          workId: work.id,
          userId: author.id,
          // On peut ajouter un champ orderId si nécessaire
        }
      })

      if (existingRoyalty) {
        console.log(`💰 Royalty already exists for work ${work.id} and author ${author.id}`)
        continue
      }

      // Créer la royalty
      const royalty = await prisma.royalty.create({
        data: {
          workId: work.id,
          userId: author.id,
          amount: royaltyAmount,
          paid: false // Les royalties ne sont pas payées immédiatement
        }
      })

      createdRoyalties.push({
        id: royalty.id,
        workTitle: work.title,
        authorName: author.name,
        amount: royaltyAmount,
        quantity: item.quantity,
        unitPrice: item.price
      })

      console.log(`💰 Created royalty: ${royaltyAmount} FCFA for ${author.name} (${work.title})`)
    }

    // Créer des notifications pour les auteurs
    const authorIds = [...new Set(order.items.map(item => item.work.author?.id).filter(Boolean))]
    
    for (const authorId of authorIds) {
      const authorWorks = order.items.filter(item => item.work.author?.id === authorId)
      const totalRoyalty = authorWorks.reduce((sum, item) => {
        return sum + (item.price * item.quantity * royaltyRate)
      }, 0)

      // TODO: Créer une notification pour l'auteur
      console.log(`📢 Notification à créer: Royalty de ${totalRoyalty} FCFA pour l'auteur ${authorId}`)
    }

    return NextResponse.json({
      message: "Royalties calculated successfully",
      royalties: createdRoyalties,
      totalAmount: createdRoyalties.reduce((sum, r) => sum + r.amount, 0),
      orderId: order.id
    })

  } catch (error) {
    console.error("❌ Error calculating royalties:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// GET - Récupérer les royalties en attente de paiement
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seuls les PDG et les représentants peuvent voir les royalties en attente
    if (!["PDG", "REPRESENTANT"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - PDG or REPRESENTANT role required" }, { status: 403 })
    }

    console.log(`💰 Fetching pending royalties for: ${user.name}`)

    // Récupérer toutes les royalties en attente
    const pendingRoyalties = await prisma.royalty.findMany({
      where: { paid: false },
      include: {
        work: {
          include: {
            discipline: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculer les statistiques
    const stats = {
      totalPending: pendingRoyalties.length,
      totalAmount: pendingRoyalties.reduce((sum, r) => sum + r.amount, 0),
      authorsCount: new Set(pendingRoyalties.map(r => r.userId)).size,
      oldestPending: pendingRoyalties.length > 0 ? pendingRoyalties[pendingRoyalties.length - 1].createdAt : null
    }

    return NextResponse.json({
      royalties: pendingRoyalties,
      stats
    })

  } catch (error) {
    console.error("❌ Error fetching pending royalties:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
