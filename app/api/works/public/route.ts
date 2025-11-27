import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allowGuest } from "@/lib/auth-guard"

export const dynamic = 'force-dynamic'

// GET /api/works/public - Récupérer les œuvres publiques (accessible en mode invité)
export const GET = allowGuest(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ON_SALE'
    const disciplineId = searchParams.get('disciplineId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre - uniquement les œuvres publiques
    const whereClause: any = {
      status: 'ON_SALE' // Seulement les œuvres en vente sont publiques
    }

    if (disciplineId) {
      whereClause.disciplineId = disciplineId
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where: whereClause,
        include: {
          discipline: {
            select: {
              id: true,
              name: true
            }
          },
          author: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.work.count({ where: whereClause })
    ])

    return NextResponse.json({
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        discipline: work.discipline,
        author: work.author,
        status: work.status,
        createdAt: work.createdAt.toISOString()
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching public works:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des œuvres publiques" },
      { status: 500 }
    )
  }
})

