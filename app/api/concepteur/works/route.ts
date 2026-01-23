import { logger } from '@/lib/logger'
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
    logger.error('Erreur lors de la récupération des œuvres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/concepteur/works - Modifier une œuvre
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { workId, ...updateData } = body

    if (!workId) {
      return NextResponse.json({ error: 'ID de l\'œuvre requis' }, { status: 400 })
    }

    // Vérifier que l'œuvre appartient au concepteur
    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: 'Œuvre non trouvée' }, { status: 404 })
    }

    if (work.concepteurId !== session.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres œuvres' }, { status: 403 })
    }

    // Mettre à jour l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: updateData,
      include: {
        discipline: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } }
      }
    })

    return NextResponse.json(updatedWork)

  } catch (error: any) {
    logger.error('Erreur lors de la modification de l\'œuvre:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/concepteur/works - Supprimer une œuvre
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('id')

    if (!workId) {
      return NextResponse.json({ error: 'ID de l\'œuvre requis' }, { status: 400 })
    }

    // Vérifier que l'œuvre appartient au concepteur
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Œuvre non trouvée' }, { status: 404 })
    }

    if (work.concepteurId !== session.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos propres œuvres' }, { status: 403 })
    }

    // Ne pas autoriser la suppression si l'œuvre a des commandes
    if (work._count.orderItems > 0) {
      return NextResponse.json({
        error: 'Impossible de supprimer une œuvre ayant des commandes'
      }, { status: 400 })
    }

    // Ne permettre la suppression que pour les œuvres en DRAFT ou PENDING
    if (!['DRAFT', 'PENDING'].includes(work.status)) {
      return NextResponse.json({
        error: 'Seules les œuvres en brouillon ou en attente peuvent être supprimées'
      }, { status: 400 })
    }

    // Supprimer l'œuvre
    await prisma.work.delete({
      where: { id: workId }
    })

    return NextResponse.json({ message: 'Œuvre supprimée avec succès' })

  } catch (error: any) {
    logger.error('Erreur lors de la suppression de l\'œuvre:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
