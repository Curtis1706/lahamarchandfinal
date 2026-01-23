import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/stock - Consulter le stock (lecture seule)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const disciplineId = searchParams.get('disciplineId')
    const status = searchParams.get('status')
    const lowStock = searchParams.get('lowStock') === 'true'

    // Construire les filtres
    const where: any = {
      status: { in: ['ON_SALE', 'PUBLISHED'] } // Seulement les œuvres en vente
    }

    if (disciplineId && disciplineId !== 'all') {
      where.disciplineId = disciplineId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (lowStock) {
      where.stock = {
        lte: where.minStock || 10 // Stock inférieur au seuil minimum
      }
    }

    // Récupérer les œuvres avec leurs informations
    const works = await prisma.work.findMany({
      where,
      select: {
        id: true,
        title: true,
        isbn: true,
        price: true,
        stock: true,
        minStock: true,
        maxStock: true,
        status: true,
        createdAt: true,
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
      orderBy: {
        title: 'asc'
      }
    })

    // Calculer les statistiques du stock
    const totalWorks = works.length
    const totalStock = works.reduce((sum, work) => sum + work.stock, 0)
    const totalValue = works.reduce((sum, work) => sum + (work.stock * work.price), 0)
    const lowStockWorks = works.filter(work => work.stock <= work.minStock)

    // Statistiques par discipline
    const statsByDiscipline = works.reduce((acc, work) => {
      const disciplineName = work.discipline.name
      if (!acc[disciplineName]) {
        acc[disciplineName] = {
          discipline: disciplineName,
          count: 0,
          stock: 0,
          value: 0
        }
      }
      acc[disciplineName].count += 1
      acc[disciplineName].stock += work.stock
      acc[disciplineName].value += (work.stock * work.price)
      return acc
    }, {} as Record<string, any>)

    // Récupérer les mouvements récents (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Formater les données
    const response = {
      summary: {
        totalWorks,
        totalStock,
        totalValue,
        lowStockCount: lowStockWorks.length,
        lastUpdated: new Date().toISOString()
      },
      works: works.map(work => ({
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        stock: work.stock,
        minStock: work.minStock,
        maxStock: work.maxStock,
        status: work.status,
        isLowStock: work.stock <= work.minStock,
        discipline: work.discipline.name,
        author: work.author?.name || "Auteur inconnu",
        createdAt: work.createdAt.toISOString()
      })),
      statistics: {
        byDiscipline: Object.values(statsByDiscipline),
        lowStockWorks: lowStockWorks.map(work => ({
          id: work.id,
          title: work.title,
          isbn: work.isbn,
          currentStock: work.stock,
          minStock: work.minStock,
          discipline: work.discipline.name,
          author: work.author?.name || "Auteur inconnu"
        }))
      },
      recentMovements: recentMovements.map(movement => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference,
        work: {
          id: movement.work.id,
          title: movement.work.title,
          isbn: movement.work.isbn
        },
        performedBy: movement.performedByUser?.name || "Système",
        createdAt: movement.createdAt.toISOString()
      }))
    }

    return NextResponse.json(response)

  } catch (error: any) {
    logger.error('Erreur lors de la consultation du stock:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
