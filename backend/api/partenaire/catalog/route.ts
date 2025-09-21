import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    console.log("🏢 Getting partner catalog...")
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

    const { searchParams } = new URL(request.url)
    const discipline = searchParams.get('discipline')
    const author = searchParams.get('author')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Construire les filtres
    const where: any = {
      status: "ON_SALE"
    }

    if (discipline && discipline !== "all") {
      where.discipline = {
        name: discipline
      }
    }

    if (author && author !== "all") {
      where.author = {
        name: {
          contains: author,
          mode: "insensitive"
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { author: { name: { contains: search, mode: "insensitive" } } }
      ]
    }

    // Récupérer les œuvres
    const works = await prisma.work.findMany({
      where,
      include: {
        discipline: true,
        author: true,
        concepteur: true
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    // Récupérer les disciplines pour les filtres
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" }
    })

    // Récupérer les auteurs pour les filtres
    const authors = await prisma.user.findMany({
      where: { role: Role.AUTEUR },
      select: { name: true },
      orderBy: { name: "asc" }
    })

    const response = {
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        tva: work.tva,
        stock: work.stock,
        minStock: work.minStock,
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
        totalValue: work.price * work.stock,
        stockStatus: work.stock === 0 ? "out" : work.stock <= work.minStock ? "low" : "available"
      })),
      filters: {
        disciplines: disciplines.map(d => ({ id: d.id, name: d.name })),
        authors: authors.map(a => a.name).filter((name, index, arr) => arr.indexOf(name) === index)
      },
      summary: {
        totalWorks: works.length,
        totalStock: works.reduce((sum, work) => sum + work.stock, 0),
        totalValue: works.reduce((sum, work) => sum + (work.price * work.stock), 0),
        lowStockCount: works.filter(work => work.stock <= work.minStock).length,
        outOfStockCount: works.filter(work => work.stock === 0).length
      }
    }

    console.log("✅ Partner catalog prepared:", {
      worksCount: works.length,
      disciplinesCount: disciplines.length,
      authorsCount: authors.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching partner catalog:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement du catalogue" },
      { status: 500 }
    )
  }
}
