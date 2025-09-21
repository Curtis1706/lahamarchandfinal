import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const discipline = searchParams.get("discipline") || ""
    const sortBy = searchParams.get("sortBy") || "title"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Construire les filtres
    const where: any = {
      status: { in: ["ON_SALE", "PUBLISHED"] } // Livres en vente et publiés
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } },
        { isbn: { contains: search, mode: "insensitive" } }
      ]
    }

    if (discipline && discipline !== "all") {
      where.discipline = {
        name: { equals: discipline, mode: "insensitive" }
      }
    }

    // Construire l'ordre de tri
    let orderBy: any = {}
    switch (sortBy) {
      case "price":
        orderBy.price = sortOrder
        break
      case "date":
        orderBy.createdAt = sortOrder
        break
      case "title":
      default:
        orderBy.title = sortOrder
        break
    }

    // Récupérer les livres avec pagination
    const [works, totalCount, disciplines] = await Promise.all([
      prisma.work.findMany({
        where,
        include: {
          discipline: true,
          author: {
            select: { id: true, name: true }
          },
          concepteur: {
            select: { id: true, name: true }
          },
          sales: {
            select: { quantity: true }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.work.count({ where }),
      // Récupérer toutes les disciplines pour les filtres
      prisma.discipline.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      })
    ])

    // Formater les données
    const formattedWorks = works.map(work => ({
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      price: work.price,
      discipline: work.discipline.name,
      disciplineId: work.discipline.id,
      author: work.author?.name || "Auteur inconnu",
      concepteur: work.concepteur?.name || "Concepteur inconnu",
      createdAt: work.createdAt,
      totalSales: work.sales.reduce((sum, sale) => sum + sale.quantity, 0),
      // Informations pour l'affichage
      priceFormatted: `${work.price.toLocaleString()} FCFA`,
      availability: "En stock" // Pour l'instant, tous les livres ON_SALE sont en stock
    }))

    return NextResponse.json({
      works: formattedWorks,
      disciplines,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        search,
        discipline,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error("Error fetching catalog:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



