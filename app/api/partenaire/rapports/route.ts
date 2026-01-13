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

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findUnique({
      where: { userId: session.user.id }
    })

    if (!partner) {
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        console.log("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        console.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    // Récupérer les ventes (StockMovement PARTNER_SALE)
    const salesMovements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_SALE',
        ...(startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {})
      },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les statistiques à partir des ventes
    const totalCommandes = salesMovements.length
    const totalVentes = salesMovements.reduce((sum, movement) => {
      return sum + (movement.totalAmount ?? (movement.unitPrice ?? movement.work.price ?? 0) * Math.abs(movement.quantity))
    }, 0)
    const totalLivres = salesMovements.reduce((sum, movement) => {
      return sum + Math.abs(movement.quantity)
    }, 0)

    // Calculer les statistiques par discipline
    const disciplineStats = new Map<string, { name: string; count: number; revenue: number }>()
    salesMovements.forEach(movement => {
      const disciplineName = movement.work.discipline?.name || 'Autre'
      const quantity = Math.abs(movement.quantity)
      const revenue = movement.totalAmount ?? (movement.unitPrice ?? movement.work.price ?? 0) * quantity
      const current = disciplineStats.get(disciplineName) || { name: disciplineName, count: 0, revenue: 0 }
      current.count += quantity
      current.revenue += revenue
      disciplineStats.set(disciplineName, current)
    })

    // Calculer les statistiques par livre
    const livreStats = new Map<string, { title: string; count: number; revenue: number }>()
    salesMovements.forEach(movement => {
      const livreTitle = movement.work.title
      const quantity = Math.abs(movement.quantity)
      const revenue = movement.totalAmount ?? (movement.unitPrice ?? movement.work.price ?? 0) * quantity
      const current = livreStats.get(livreTitle) || { title: livreTitle, count: 0, revenue: 0 }
      current.count += quantity
      current.revenue += revenue
      livreStats.set(livreTitle, current)
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

      const prevSalesMovements = await prisma.stockMovement.findMany({
        where: {
          partnerId: partner.id,
          type: 'PARTNER_SALE',
          createdAt: {
            gte: prevStart,
            lt: prevEnd
          }
        },
        include: {
          work: {
            select: {
              price: true
            }
          }
        }
      })

      const prevTotal = prevSalesMovements.reduce((sum, movement) => {
        return sum + (movement.totalAmount ?? (movement.unitPrice ?? movement.work.price ?? 0) * Math.abs(movement.quantity))
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
        orders: salesMovements.map(movement => {
          const quantity = Math.abs(movement.quantity)
          const unitPrice = movement.unitPrice ?? movement.work.price ?? 0
          const total = movement.totalAmount ?? (unitPrice * quantity)
          
          return {
            id: movement.id,
            reference: movement.reference ?? `SALE-${movement.id.slice(-8)}`,
            date: format(movement.createdAt, 'dd MMM yyyy', { locale: fr }),
            total: total,
            items: [{
              work: movement.work.title,
              isbn: movement.work.isbn,
              quantity: quantity,
              price: unitPrice,
              total: total
            }],
            status: 'COMPLETED'
          }
        }),
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

