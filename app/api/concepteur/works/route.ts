import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/concepteur/works - Récupérer les œuvres du concepteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const disciplineId = searchParams.get('disciplineId')

    // Construire les filtres
    const where: any = {
      concepteurId: session.user.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (disciplineId && disciplineId !== 'all') {
      where.disciplineId = disciplineId
    }

    const works = await prisma.work.findMany({
      where,
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
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données
    const formattedWorks = works.map(work => ({
      id: work.id,
      title: work.title,
      description: work.description,
      isbn: work.isbn,
      price: work.price,
      stock: work.stock,
      status: work.status,
      discipline: work.discipline,
      author: work.author,
      project: work.project,
      totalOrders: work._count.orderItems,
      submittedAt: work.submittedAt?.toISOString(),
      publishedAt: work.publishedAt?.toISOString(),
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString()
    }))

    return NextResponse.json(formattedWorks)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des œuvres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
