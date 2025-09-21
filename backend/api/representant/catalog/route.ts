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

    // Récupérer les œuvres en vente
    const works = await prisma.work.findMany({
      where: { status: "ON_SALE" },
      include: {
        discipline: true,
        author: true,
        concepteur: true
      },
      orderBy: { createdAt: "desc" }
    })

    // Statistiques du catalogue
    const totalWorks = works.length
    const totalValue = works.reduce((sum, work) => sum + (work.price * work.stock), 0)
    const disciplines = [...new Set(works.map(w => w.discipline.name))]
    const authors = [...new Set(works.map(w => w.author?.name).filter(Boolean))]

    // Top œuvres par stock
    const topWorksByStock = works
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10)

    // Répartition par discipline
    const disciplineStats = works.reduce((acc, work) => {
      const discipline = work.discipline.name
      if (!acc[discipline]) {
        acc[discipline] = { count: 0, totalValue: 0 }
      }
      acc[discipline].count += 1
      acc[discipline].totalValue += work.price * work.stock
      return acc
    }, {} as Record<string, { count: number; totalValue: number }>)

    const response = {
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        tva: work.tva,
        stock: work.stock,
        status: work.status,
        publishedAt: work.publishedAt,
        discipline: {
          id: work.discipline.id,
          name: work.discipline.name
        },
        author: work.author ? {
          id: work.author.id,
          name: work.author.name,
          email: work.author.email
        } : null,
        concepteur: work.concepteur ? {
          id: work.concepteur.id,
          name: work.concepteur.name,
          email: work.concepteur.email
        } : null,
        totalValue: work.price * work.stock
      })),
      summary: {
        totalWorks,
        totalValue: Math.round(totalValue),
        disciplines: disciplines.length,
        authors: authors.length,
        averagePrice: totalWorks > 0 ? Math.round(works.reduce((sum, w) => sum + w.price, 0) / totalWorks) : 0,
        totalStock: works.reduce((sum, w) => sum + w.stock, 0)
      },
      topWorksByStock: topWorksByStock.map(work => ({
        id: work.id,
        title: work.title,
        stock: work.stock,
        price: work.price,
        discipline: work.discipline.name,
        author: work.author?.name || "Auteur inconnu",
        totalValue: work.price * work.stock
      })),
      disciplineStats: Object.entries(disciplineStats).map(([discipline, stats]) => ({
        discipline,
        count: stats.count,
        totalValue: Math.round(stats.totalValue),
        percentage: totalWorks > 0 ? Math.round((stats.count / totalWorks) * 100) : 0
      }))
    }

    console.log("✅ Catalog data prepared:", {
      totalWorks,
      totalValue: Math.round(totalValue),
      disciplines: disciplines.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching catalog:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement du catalogue" },
      { status: 500 }
    )
  }
}
