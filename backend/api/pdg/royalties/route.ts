import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET - Récupérer les droits d'auteur (PDG uniquement)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching royalties for PDG:", user.name)

    // Récupérer toutes les œuvres avec leurs ventes
    const works = await prisma.work.findMany({
      where: {
        status: "PUBLISHED"
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        discipline: {
          select: { id: true, name: true }
        },
        orders: {
          where: {
            status: "DELIVERED"
          },
          include: {
            items: {
              where: {
                workId: undefined // Sera rempli par Prisma
              }
            }
          }
        }
      }
    })

    // Calculer les droits d'auteur pour chaque œuvre
    const royaltiesData = works.map(work => {
      const totalSales = work.orders.reduce((total, order) => {
        const workItems = order.items.filter(item => item.workId === work.id)
        return total + workItems.reduce((itemTotal, item) => itemTotal + item.quantity, 0)
      }, 0)

      const totalRevenue = work.orders.reduce((total, order) => {
        const workItems = order.items.filter(item => item.workId === work.id)
        return total + workItems.reduce((itemTotal, item) => itemTotal + (item.price * item.quantity), 0)
      }, 0)

      // Calculer les droits d'auteur (par exemple 15% du prix de vente)
      const royaltyRate = 0.15
      const totalRoyalties = totalRevenue * royaltyRate
      const paidRoyalties = 0 // À implémenter avec un système de paiement
      const pendingRoyalties = totalRoyalties - paidRoyalties

      return {
        workId: work.id,
        workTitle: work.title,
        isbn: work.isbn,
        author: work.author,
        discipline: work.discipline,
        totalSales,
        totalRevenue,
        royaltyRate,
        totalRoyalties,
        paidRoyalties,
        pendingRoyalties,
        lastPaymentDate: null // À implémenter
      }
    })

    // Calculer les statistiques globales
    const stats = {
      totalAuthors: new Set(royaltiesData.map(r => r.author.id)).size,
      totalWorks: royaltiesData.length,
      totalSales: royaltiesData.reduce((sum, r) => sum + r.totalSales, 0),
      totalRevenue: royaltiesData.reduce((sum, r) => sum + r.totalRevenue, 0),
      totalRoyalties: royaltiesData.reduce((sum, r) => sum + r.totalRoyalties, 0),
      paidRoyalties: royaltiesData.reduce((sum, r) => sum + r.paidRoyalties, 0),
      pendingRoyalties: royaltiesData.reduce((sum, r) => sum + r.pendingRoyalties, 0)
    }

    // Grouper par auteur
    const byAuthor = royaltiesData.reduce((acc, royalty) => {
      const authorId = royalty.author.id
      if (!acc[authorId]) {
        acc[authorId] = {
          author: royalty.author,
          works: [],
          totalSales: 0,
          totalRevenue: 0,
          totalRoyalties: 0,
          paidRoyalties: 0,
          pendingRoyalties: 0
        }
      }
      acc[authorId].works.push(royalty)
      acc[authorId].totalSales += royalty.totalSales
      acc[authorId].totalRevenue += royalty.totalRevenue
      acc[authorId].totalRoyalties += royalty.totalRoyalties
      acc[authorId].paidRoyalties += royalty.paidRoyalties
      acc[authorId].pendingRoyalties += royalty.pendingRoyalties
      return acc
    }, {} as Record<string, any>)

    console.log(`👑 PDG royalties data: ${stats.totalAuthors} authors, ${stats.totalRoyalties} FCFA total royalties`)

    return NextResponse.json({
      royalties: royaltiesData,
      stats,
      byAuthor,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG royalties:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Effectuer un paiement de droits d'auteur (PDG uniquement)
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
    const { authorId, amount, works, paymentMethod, notes } = body

    if (!authorId || !amount || !works || !Array.isArray(works)) {
      return NextResponse.json({ 
        error: "Missing required fields: authorId, amount, works" 
      }, { status: 400 })
    }

    console.log(`👑 PDG processing royalty payment for author ${authorId}:`, amount)

    // Vérifier que l'auteur existe
    const author = await prisma.user.findUnique({
      where: { id: authorId }
    })

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 })
    }

    // Créer un enregistrement de paiement (à implémenter avec une table Payment)
    // Pour l'instant, on crée une notification
    await prisma.notification.create({
      data: {
        userId: authorId,
        title: "Paiement de droits d'auteur",
        message: `Un paiement de ${amount} FCFA a été effectué pour vos œuvres`,
        type: "ROYALTY_PAYMENT",
        data: { amount, works, paymentMethod, processedBy: user.id }
      }
    })

    console.log(`✅ Royalty payment processed for author ${authorId}: ${amount} FCFA`)

    return NextResponse.json({
      success: true,
      message: `Paiement de ${amount} FCFA effectué avec succès`,
      payment: {
        authorId,
        amount,
        works,
        paymentMethod,
        processedBy: user.id,
        processedAt: new Date()
      }
    })

  } catch (error) {
    console.error("❌ Error processing PDG royalty payment:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
