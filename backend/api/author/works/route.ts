import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus } from "@prisma/client"

// GET - Récupérer les œuvres de l'auteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    console.log("📚 Fetching author works for:", user.name)

    const userId = user.id

    // Récupérer toutes les œuvres de l'auteur avec détails
    const works = await prisma.work.findMany({
      where: { authorId: userId },
      include: {
        discipline: true,
        concepteur: {
          select: { name: true }
        },
        orderItems: {
          include: {
            order: true
          }
        },
        royalties: {
          where: { userId: userId },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transformer les données pour l'affichage
    const formattedWorks = works.map(work => {
      const totalSales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
      
      const totalRevenue = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== "CANCELLED" ? (item.price * item.quantity) : 0)
      }, 0)
      
      const totalRoyalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
      const paidRoyalties = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)
      const pendingRoyalties = totalRoyalties - paidRoyalties
      
      const lastPayment = work.royalties
        .filter(r => r.paid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      
      const nextPayment = work.royalties
        .filter(r => !r.paid)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

      return {
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        status: work.status,
        discipline: work.discipline.name,
        conceptor: work.concepteur?.name || "Non assigné",
        createdAt: work.createdAt,
        sales: {
          total: totalSales,
          revenue: totalRevenue
        },
        royalties: {
          total: totalRoyalties,
          paid: paidRoyalties,
          pending: pendingRoyalties,
          rate: 15 // Taux fixe pour l'instant
        },
        lastPayment: lastPayment ? {
          amount: lastPayment.amount,
          date: lastPayment.createdAt,
          paid: lastPayment.paid
        } : null,
        nextPayment: nextPayment ? {
          amount: nextPayment.amount,
          date: nextPayment.createdAt,
          paid: nextPayment.paid
        } : null
      }
    })

    // Calculer les statistiques globales
    const stats = {
      totalWorks: works.length,
      publishedWorks: works.filter(w => w.status === "ON_SALE").length,
      submittedWorks: works.filter(w => w.status === "SUBMITTED").length,
      acceptedWorks: works.filter(w => w.status === "ACCEPTED").length,
      totalSales: formattedWorks.reduce((sum, work) => sum + work.sales.total, 0),
      totalRevenue: formattedWorks.reduce((sum, work) => sum + work.sales.revenue, 0),
      totalRoyalties: formattedWorks.reduce((sum, work) => sum + work.royalties.total, 0),
      paidRoyalties: formattedWorks.reduce((sum, work) => sum + work.royalties.paid, 0),
      pendingRoyalties: formattedWorks.reduce((sum, work) => sum + work.royalties.pending, 0)
    }

    console.log(`📚 Found ${works.length} works for author`)

    return NextResponse.json({
      works: formattedWorks,
      stats
    })

  } catch (error) {
    console.error("❌ Error fetching author works:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Non autorisé pour les auteurs (rôle passif)
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: "Forbidden - Authors cannot create works. This is reserved for Concepteurs." 
  }, { status: 403 })
}
