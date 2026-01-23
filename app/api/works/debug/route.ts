import { logger } from '@/lib/logger'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/works/debug - Debug endpoint for works
export async function GET(request: NextRequest) {
  try {
    // Désactiver en production pour sécurité
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Endpoint not available in production" }, { status: 404 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Récupérer les œuvres avec leurs statistiques
    const works = await prisma.work.findMany({
      take: limit,
      skip: offset,
      include: {
        discipline: true,
        author: true,
        concepteur: true,
        orderItems: {
          include: {
            order: {
              select: {
                status: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les statistiques pour chaque œuvre
    const worksWithStats = works.map(work => {
      const totalSales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order?.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)

      const totalRevenue = work.orderItems.reduce((sum, item) => {
        return sum + (item.order?.status !== "CANCELLED" ? item.price * item.quantity : 0)
      }, 0)

      const recentSales = work.orderItems.filter(item => {
        if (!item.order?.createdAt) return false
        const orderDate = new Date(item.order.createdAt)
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return orderDate > oneWeekAgo && item.order.status !== "CANCELLED"
      }).reduce((sum, item) => sum + item.quantity, 0)

      return {
        id: work.id,
        title: work.title,
        status: work.status,
        price: work.price,
        isbn: work.isbn,
        createdAt: work.createdAt,
        discipline: work.discipline?.name || 'N/A',
        author: work.author?.name || 'N/A',
        concepteur: work.concepteur?.name || 'N/A',
        totalSales,
        totalRevenue,
        recentSales,
        orderCount: work.orderItems.length
      }
    })

    // Statistiques globales
    const globalStats = {
      totalWorks: worksWithStats.length,
      totalSales: worksWithStats.reduce((sum, work) => sum + work.totalSales, 0),
      totalRevenue: worksWithStats.reduce((sum, work) => sum + work.totalRevenue, 0),
      averagePrice: worksWithStats.length > 0 ? worksWithStats.reduce((sum, work) => sum + work.price, 0) / worksWithStats.length : 0,
      worksByStatus: worksWithStats.reduce((acc, work) => {
        acc[work.status] = (acc[work.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      works: worksWithStats,
      stats: globalStats,
      pagination: {
        limit,
        offset,
        hasMore: works.length === limit
      }
    })

  } catch (error: any) {
    logger.error("Error fetching works debug:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des œuvres de debug" },
      { status: 500 }
    )
  }
}
