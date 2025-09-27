import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/stock/statistics - Récupérer les statistiques avancées
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
    const type = searchParams.get('type') // 'discipline', 'sales', 'popular', 'overview'
    const period = searchParams.get('period') || '30' // jours
    const disciplineId = searchParams.get('disciplineId')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    switch (type) {
      case 'discipline':
        // Statistiques par discipline
        const disciplineStats = await prisma.discipline.findMany({
          include: {
            works: {
              where: {
                status: 'PUBLISHED'
              },
              include: {
                _count: {
                  select: {
                    workSales: {
                      where: {
                        saleDate: {
                          gte: startDate
                        }
                      }
                    },
                    workDistributions: {
                      where: {
                        distributionDate: {
                          gte: startDate
                        }
                      }
                    },
                    workViews: {
                      where: {
                        viewedAt: {
                          gte: startDate
                        }
                      }
                    }
                  }
                },
                workSales: {
                  where: {
                    saleDate: {
                      gte: startDate
                    }
                  },
                  select: {
                    quantity: true,
                    amount: true
                  }
                }
              }
            }
          }
        })

        const disciplineData = disciplineStats.map(discipline => {
          const totalWorks = discipline.works.length
          const totalSales = discipline.works.reduce((sum, work) => 
            sum + work.workSales.reduce((workSum, sale) => workSum + sale.quantity, 0), 0
          )
          const totalRevenue = discipline.works.reduce((sum, work) => 
            sum + work.workSales.reduce((workSum, sale) => workSum + sale.amount, 0), 0
          )
          const totalViews = discipline.works.reduce((sum, work) => 
            sum + work._count.workViews, 0
          )
          const totalDistributions = discipline.works.reduce((sum, work) => 
            sum + work._count.workDistributions, 0
          )

          return {
            id: discipline.id,
            name: discipline.name,
            totalWorks,
            totalSales,
            totalRevenue,
            totalViews,
            totalDistributions,
            averageRevenuePerWork: totalWorks > 0 ? totalRevenue / totalWorks : 0,
            averageViewsPerWork: totalWorks > 0 ? totalViews / totalWorks : 0
          }
        })

        return NextResponse.json(disciplineData)

      case 'sales':
        // Statistiques des ventes
        const salesStats = await prisma.workSale.findMany({
          where: {
            saleDate: {
              gte: startDate
            },
            ...(disciplineId ? {
              work: {
                disciplineId
              }
            } : {})
          },
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            saleDate: 'desc'
          }
        })

        // Grouper par œuvre
        const workSalesMap = new Map()
        salesStats.forEach(sale => {
          const workId = sale.work.id
          if (!workSalesMap.has(workId)) {
            workSalesMap.set(workId, {
              work: sale.work,
              totalQuantity: 0,
              totalAmount: 0,
              salesCount: 0,
              lastSaleDate: sale.saleDate
            })
          }
          const workData = workSalesMap.get(workId)
          workData.totalQuantity += sale.quantity
          workData.totalAmount += sale.amount
          workData.salesCount += 1
          if (sale.saleDate > workData.lastSaleDate) {
            workData.lastSaleDate = sale.saleDate
          }
        })

        const salesData = Array.from(workSalesMap.values())
          .sort((a, b) => b.totalAmount - a.totalAmount)

        return NextResponse.json(salesData)

      case 'popular':
        // Œuvres les plus consultées
        const popularWorks = await prisma.workView.findMany({
          where: {
            viewedAt: {
              gte: startDate
            },
            ...(disciplineId ? {
              work: {
                disciplineId
              }
            } : {})
          },
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        })

        // Grouper par œuvre
        const workViewsMap = new Map()
        popularWorks.forEach(view => {
          const workId = view.work.id
          if (!workViewsMap.has(workId)) {
            workViewsMap.set(workId, {
              work: view.work,
              viewCount: 0,
              uniqueViewers: new Set(),
              lastViewDate: view.viewedAt
            })
          }
          const workData = workViewsMap.get(workId)
          workData.viewCount += 1
          if (view.viewerId) {
            workData.uniqueViewers.add(view.viewerId)
          }
          if (view.viewedAt > workData.lastViewDate) {
            workData.lastViewDate = view.viewedAt
          }
        })

        const popularData = Array.from(workViewsMap.values())
          .map(data => ({
            ...data,
            uniqueViewerCount: data.uniqueViewers.size
          }))
          .sort((a, b) => b.viewCount - a.viewCount)

        return NextResponse.json(popularData)

      case 'overview':
        // Vue d'ensemble des statistiques
        const [
          totalWorks,
          totalSales,
          totalRevenue,
          totalViews,
          totalDistributions,
          recentSales,
          topDisciplines
        ] = await Promise.all([
          // Total des œuvres publiées
          prisma.work.count({
            where: {
              status: 'PUBLISHED'
            }
          }),
          // Total des ventes
          prisma.workSale.aggregate({
            where: {
              saleDate: {
                gte: startDate
              }
            },
            _sum: {
              quantity: true,
              amount: true
            }
          }),
          // Total des vues
          prisma.workView.count({
            where: {
              viewedAt: {
                gte: startDate
              }
            }
          }),
          // Total des distributions
          prisma.workDistribution.count({
            where: {
              distributionDate: {
                gte: startDate
              }
            }
          }),
          // Ventes récentes
          prisma.workSale.findMany({
            where: {
              saleDate: {
                gte: startDate
              }
            },
            include: {
              work: {
                select: {
                  title: true,
                  discipline: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              saleDate: 'desc'
            },
            take: 10
          }),
          // Top disciplines
          prisma.discipline.findMany({
            include: {
              works: {
                where: {
                  status: 'PUBLISHED'
                },
                include: {
                  workSales: {
                    where: {
                      saleDate: {
                        gte: startDate
                      }
                    },
                    select: {
                      amount: true
                    }
                  }
                }
              }
            }
          })
        ])

        const topDisciplinesData = topDisciplines
          .map(discipline => ({
            id: discipline.id,
            name: discipline.name,
            workCount: discipline.works.length,
            revenue: discipline.works.reduce((sum, work) => 
              sum + work.workSales.reduce((workSum, sale) => workSum + sale.amount, 0), 0
            )
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)

        return NextResponse.json({
          totalWorks,
          totalSales: totalSales._sum.quantity || 0,
          totalRevenue: totalSales._sum.amount || 0,
          totalViews,
          totalDistributions,
          recentSales,
          topDisciplines: topDisciplinesData,
          period: parseInt(period)
        })

      default:
        return NextResponse.json({ error: "Type de statistique non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
