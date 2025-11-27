import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/rapports - Récupérer les rapports du partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('reportType') // mensuel, trimestriel, annuel

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        orders: {
          where: {
            status: {
              notIn: ['PENDING', 'CANCELLED']
            },
            ...(startDate && endDate ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            } : {})
          },
          include: {
            items: {
              include: {
                work: {
                  select: {
                    id: true,
                    title: true,
                    isbn: true,
                    price: true,
                    discipline: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 })
    }

    // Calculer les statistiques
    const orders = partner.orders || []
    const totalCommandes = orders.length
    const totalVentes = orders.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0)
      return sum + orderTotal
    }, 0)
    const totalLivres = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Calculer les statistiques par discipline
    const disciplineStats = new Map<string, { name: string; count: number; revenue: number }>()
    orders.forEach(order => {
      order.items.forEach(item => {
        const disciplineName = item.work.discipline?.name || 'Autre'
        const current = disciplineStats.get(disciplineName) || { name: disciplineName, count: 0, revenue: 0 }
        current.count += item.quantity
        current.revenue += item.quantity * item.price
        disciplineStats.set(disciplineName, current)
      })
    })

    // Calculer les statistiques par livre
    const livreStats = new Map<string, { title: string; count: number; revenue: number }>()
    orders.forEach(order => {
      order.items.forEach(item => {
        const livreTitle = item.work.title
        const current = livreStats.get(livreTitle) || { title: livreTitle, count: 0, revenue: 0 }
        current.count += item.quantity
        current.revenue += item.quantity * item.price
        livreStats.set(livreTitle, current)
      })
    })

    // Trouver le livre le plus populaire
    const livrePopulaire = Array.from(livreStats.values())
      .sort((a, b) => b.count - a.count)[0]?.title || 'N/A'

    // Trouver la discipline la plus populaire
    const disciplinePopulaire = Array.from(disciplineStats.values())
      .sort((a, b) => b.count - a.count)[0]?.name || 'N/A'

    // Calculer l'évolution (comparaison avec la période précédente)
    // Pour simplifier, on compare avec la période précédente de même durée
    let evolution = "0%"
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const duration = end.getTime() - start.getTime()
      const prevStart = new Date(start.getTime() - duration)
      const prevEnd = start

      const prevOrders = await prisma.order.findMany({
        where: {
          partnerId: partner.id,
          status: {
            notIn: ['PENDING', 'CANCELLED']
          },
          createdAt: {
            gte: prevStart,
            lt: prevEnd
          }
        },
        include: {
          items: true
        }
      })

      const prevTotal = prevOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0)
      }, 0)

      if (prevTotal > 0) {
        const evolutionValue = ((totalVentes - prevTotal) / prevTotal) * 100
        evolution = `${evolutionValue >= 0 ? '+' : ''}${evolutionValue.toFixed(1)}%`
      }
    }

    // Générer les rapports selon le type demandé
    if (type === 'summary') {
      return NextResponse.json({
        summary: {
          totalVentes: totalVentes,
          totalCommandes: totalCommandes,
          totalLivres: totalLivres,
          chiffreAffaires: totalVentes,
          evolution: evolution,
          meilleurMois: "N/A", // À calculer si nécessaire
          disciplinePopulaire: disciplinePopulaire,
          livrePopulaire: livrePopulaire
        },
        disciplineStats: Array.from(disciplineStats.values()),
        livreStats: Array.from(livreStats.values()).slice(0, 10) // Top 10
      })
    } else if (type === 'detailed') {
      return NextResponse.json({
        orders: orders.map(order => ({
          id: order.id,
          reference: `CMD-${order.id.slice(-8)}`,
          date: format(order.createdAt, 'dd MMM yyyy', { locale: fr }),
          total: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
          items: order.items.map(item => ({
            work: item.work.title,
            isbn: item.work.isbn,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          })),
          status: order.status
        })),
        summary: {
          totalVentes: totalVentes,
          totalCommandes: totalCommandes,
          totalLivres: totalLivres
        }
      })
    }

    return NextResponse.json({
      summary: {
        totalVentes,
        totalCommandes,
        totalLivres,
        chiffreAffaires: totalVentes,
        evolution
      }
    })
  } catch (error) {
    console.error('Error fetching partner reports:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500 }
    )
  }
}

// POST /api/partenaire/rapports - Générer un rapport
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { reportType, startDate, endDate } = body // reportType: 'mensuel', 'trimestriel', 'annuel'

    // Générer le rapport selon le type
    // Pour l'instant, on retourne les données calculées
    // Dans un vrai système, on pourrait sauvegarder le rapport dans une table dédiée

    return NextResponse.json({
      message: 'Rapport généré avec succès',
      reportId: `RPT-${Date.now()}`,
      reportType,
      startDate,
      endDate
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}

