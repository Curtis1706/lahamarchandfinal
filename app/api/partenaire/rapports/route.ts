import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getPaginationParams } from "@/lib/pagination"

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
        logger.debug("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    // Construire la clause where pour les ventes
    const whereClause = {
      partnerId: partner.id,
      type: 'PARTNER_SALE' as const,
      ...(startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {})
    }

    // Si type === 'detailed', utiliser la pagination (pas de cache car pagination change)
    // Sinon (summary), utiliser aggregate avec cache pour les stats
    let salesMovements: any[] = []

    if (type === 'detailed') {
      // Pagination pour le type detailed
      const paginationParams = getPaginationParams(searchParams)

      const queryOptions: any = {
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
        take: paginationParams.take + 1
      }

      if (paginationParams.cursor) {
        queryOptions.cursor = { id: paginationParams.cursor }
        queryOptions.skip = 1
      }

      const movementResults = await prisma.stockMovement.findMany(queryOptions)
      const hasMore = movementResults.length > paginationParams.take
      salesMovements = hasMore ? movementResults.slice(0, -1) : movementResults
      const nextCursor = hasMore ? salesMovements[salesMovements.length - 1].id : null

      // Calculer les stats totales avec aggregate
      const statsAggregate = await prisma.stockMovement.aggregate({
        where: whereClause,
        _count: { id: true },
        _sum: { quantity: true }
      })

      // Calculer le total des ventes
      const totalVentesAggregate = await prisma.stockMovement.findMany({
        where: whereClause,
        select: {
          totalAmount: true,
          unitPrice: true,
          quantity: true,
          work: { select: { price: true } }
        },
        take: 1000 // Limiter pour éviter timeout, mais suffisant pour les stats
      })

      const totalVentes = totalVentesAggregate.reduce((sum, movement) => {
        return sum + (movement.totalAmount ?? (movement.unitPrice ?? movement.work.price ?? 0) * Math.abs(movement.quantity))
      }, 0)
      const totalLivres = Math.abs(statsAggregate._sum.quantity || 0)
      const totalCommandes = statsAggregate._count.id

      // Retourner les résultats paginés avec summary
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
        },
        pagination: {
          nextCursor: nextCursor,
          hasMore: hasMore
        }
      })
    } else {
      // Charger toutes les données (mais limiter si trop nombreuses)
      salesMovements = await prisma.stockMovement.findMany({
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limiter à 1000 pour éviter timeout sur les calculs de stats
      })
    }

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

      // Utiliser aggregate et une requête limitée pour calculer le total précédent
      const prevSalesMovements = await prisma.stockMovement.findMany({
        where: {
          partnerId: partner.id,
          type: 'PARTNER_SALE',
          createdAt: {
            gte: prevStart,
            lt: prevEnd
          }
        },
        select: {
          totalAmount: true,
          unitPrice: true,
          quantity: true,
          work: { select: { price: true } }
        },
        take: 1000 // Limiter pour éviter timeout
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
    logger.error('Error fetching partner reports:', error)
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
    logger.error('Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}

