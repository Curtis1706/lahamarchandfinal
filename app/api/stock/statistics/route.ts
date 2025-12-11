import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/stock/statistics - Récupérer les statistiques de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux statistiques
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'discipline' | 'sales' | 'popular' | 'overview'
    const period = parseInt(searchParams.get('period') || '30')
    const disciplineId = searchParams.get('disciplineId')

    // Date de début pour les statistiques basées sur la période
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    switch (type) {
      case 'overview':
        // Statistiques générales
        const totalWorks = await prisma.work.count({
          where: {
            status: 'PUBLISHED',
            ...(disciplineId && disciplineId !== 'all' ? { disciplineId } : {})
          }
        })

        // Calculer les ventes (via OrderItems)
        const salesData = await prisma.orderItem.findMany({
          where: {
            order: {
              createdAt: { gte: startDate },
              status: { in: ['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
            },
            ...(disciplineId && disciplineId !== 'all' ? {
              work: { disciplineId }
            } : {})
          },
          select: {
            quantity: true,
            price: true,
            work: {
              select: {
                title: true,
                discipline: { select: { name: true } }
              }
            }
          }
        })

        const totalSales = salesData.reduce((sum, item) => sum + item.quantity, 0)
        const totalRevenue = salesData.reduce((sum, item) => sum + (item.quantity * item.price), 0)

        // Œuvres les plus populaires (top 5)
        const workSalesMap = new Map<string, { title: string, quantity: number, discipline: string }>()
        salesData.forEach(item => {
          const existing = workSalesMap.get(item.work.title) || { 
            title: item.work.title, 
            quantity: 0, 
            discipline: item.work.discipline.name 
          }
          existing.quantity += item.quantity
          workSalesMap.set(item.work.title, existing)
        })

        const popularWorks = Array.from(workSalesMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        return NextResponse.json({
          totalWorks,
          totalSales,
          totalRevenue,
          popularWorks,
          period
        })

      case 'discipline':
        // Statistiques par discipline
        const disciplines = await prisma.discipline.findMany({
          where: { isActive: true },
          include: {
            works: {
              where: { status: 'PUBLISHED' },
              select: {
                id: true,
                stock: true,
                price: true,
                orderItems: {
                  where: {
                    order: {
                      createdAt: { gte: startDate },
                      status: { in: ['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
                    }
                  },
                  select: {
                    quantity: true,
                    price: true
                  }
                }
              }
            }
          }
        })

        const disciplineStats = disciplines.map(discipline => {
          const totalBooks = discipline.works.length
          const totalStock = discipline.works.reduce((sum, work) => sum + work.stock, 0)
          const sales = discipline.works.flatMap(work => work.orderItems)
          const totalSales = sales.reduce((sum, item) => sum + item.quantity, 0)
          const revenue = sales.reduce((sum, item) => sum + (item.quantity * item.price), 0)

          return {
            name: discipline.name,
            totalBooks,
            totalStock,
            totalSales,
            revenue
          }
        })

        return NextResponse.json(disciplineStats)

      case 'sales':
        // Évolution des ventes sur la période
        const salesByDate = await prisma.orderItem.groupBy({
          by: ['orderId'],
          where: {
            order: {
              createdAt: { gte: startDate },
              status: { in: ['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
              ...(disciplineId && disciplineId !== 'all' ? {
                items: {
                  some: {
                    work: { disciplineId }
                  }
                }
              } : {})
            }
          },
          _sum: {
            quantity: true
          }
        })

        // Grouper par semaine ou jour selon la période
        const groupBy = period > 90 ? 'week' : 'day'
        
        return NextResponse.json({
          sales: salesByDate,
          groupBy,
          period
        })

      case 'popular':
        // Œuvres les plus vendues
        const popularBooks = await prisma.orderItem.groupBy({
          by: ['workId'],
          where: {
            order: {
              createdAt: { gte: startDate },
              status: { in: ['VALIDATED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
            },
            ...(disciplineId && disciplineId !== 'all' ? {
              work: { disciplineId }
            } : {})
          },
          _sum: {
            quantity: true
          },
          orderBy: {
            _sum: {
              quantity: 'desc'
            }
          },
          take: 10
        })

        // Récupérer les informations des œuvres
        const workIds = popularBooks.map(item => item.workId)
        const worksInfo = await prisma.work.findMany({
          where: { id: { in: workIds } },
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            discipline: { select: { name: true } },
            author: { select: { name: true } }
          }
        })

        const popularWorksWithInfo = popularBooks.map(item => {
          const work = worksInfo.find(w => w.id === item.workId)
          return {
            work,
            totalSales: item._sum.quantity || 0
          }
        })

        return NextResponse.json(popularWorksWithInfo)

      default:
        return NextResponse.json({ error: "Type de statistique invalide" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching stock statistics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
