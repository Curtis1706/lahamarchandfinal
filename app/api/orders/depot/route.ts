import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Vérifier que l'utilisateur est PDG
        if (session.user.role !== 'PDG') {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)

        // Paramètres de pagination
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Paramètres de filtrage
        const searchTerm = searchParams.get('search') || ''
        const paymentStatus = searchParams.get('paymentStatus') || 'all'
        const category = searchParams.get('category') || 'all'
        const classe = searchParams.get('classe') || 'all'
        const discipline = searchParams.get('discipline') || 'all'
        const dateFrom = searchParams.get('dateFrom')
        const dateTo = searchParams.get('dateTo')

        // Construction des filtres
        const where: any = {
            paymentMethod: 'depot'
        }

        // Filtre par statut de paiement
        if (paymentStatus !== 'all') {
            if (paymentStatus === 'overdue') {
                // Paiements en retard (date de rappel dépassée et non payé)
                where.paymentStatus = 'UNPAID'
                where.paymentDueDate = {
                    lt: new Date()
                }
            } else if (paymentStatus === 'upcoming') {
                // Paiements à venir (dans les 7 prochains jours)
                const sevenDaysFromNow = new Date()
                sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
                where.paymentStatus = 'UNPAID'
                where.paymentDueDate = {
                    gte: new Date(),
                    lte: sevenDaysFromNow
                }
            } else {
                where.paymentStatus = paymentStatus
            }
        }

        // Filtre par date de rappel
        if (dateFrom || dateTo) {
            where.paymentDueDate = {}
            if (dateFrom) {
                where.paymentDueDate.gte = new Date(dateFrom)
            }
            if (dateTo) {
                where.paymentDueDate.lte = new Date(dateTo)
            }
        }

        // Filtre par recherche (client ou livre)
        if (searchTerm) {
            where.OR = [
                {
                    user: {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } },
                            { phone: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    items: {
                        some: {
                            work: {
                                title: { contains: searchTerm, mode: 'insensitive' }
                            }
                        }
                    }
                }
            ]
        }

        // Filtres par catégorie, classe, discipline
        if (category !== 'all' || classe !== 'all' || discipline !== 'all') {
            where.items = {
                some: {
                    work: {}
                }
            }

            if (category !== 'all') {
                where.items.some.work.category = category
            }
            if (classe !== 'all') {
                where.items.some.work.classe = classe
            }
            if (discipline !== 'all') {
                where.items.some.work.disciplineId = discipline
            }
        }

        // Récupérer les commandes avec pagination
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true
                        }
                    },
                    items: {
                        include: {
                            work: {
                                include: {
                                    discipline: true,
                                    author: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    partner: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    paymentDueDate: 'asc'
                },
                skip,
                take: limit
            }),
            prisma.order.count({ where })
        ])

        // Calculer les statistiques
        const allDepotOrders = await prisma.order.findMany({
            where: {
                paymentMethod: 'depot'
            },
            select: {
                id: true,
                total: true,
                paymentStatus: true,
                paymentDueDate: true,
                remainingAmount: true
            }
        })

        const now = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        const stats = {
            totalOrders: allDepotOrders.length,
            totalAmount: allDepotOrders.reduce((sum, order) => sum + order.remainingAmount, 0),
            overdueOrders: allDepotOrders.filter(
                order => order.paymentStatus === 'UNPAID' && order.paymentDueDate && order.paymentDueDate < now
            ).length,
            overdueAmount: allDepotOrders
                .filter(order => order.paymentStatus === 'UNPAID' && order.paymentDueDate && order.paymentDueDate < now)
                .reduce((sum, order) => sum + order.remainingAmount, 0),
            upcomingOrders: allDepotOrders.filter(
                order => order.paymentStatus === 'UNPAID' && order.paymentDueDate &&
                    order.paymentDueDate >= now && order.paymentDueDate <= sevenDaysFromNow
            ).length,
            upcomingAmount: allDepotOrders
                .filter(order => order.paymentStatus === 'UNPAID' && order.paymentDueDate &&
                    order.paymentDueDate >= now && order.paymentDueDate <= sevenDaysFromNow)
                .reduce((sum, order) => sum + order.remainingAmount, 0),
            paidOrders: allDepotOrders.filter(order => order.paymentStatus === 'PAID').length
        }

        // Enrichir les commandes avec des informations calculées
        const enrichedOrders = orders.map(order => {
            const daysRemaining = order.paymentDueDate
                ? Math.ceil((order.paymentDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null

            return {
                ...order,
                daysRemaining,
                isOverdue: daysRemaining !== null && daysRemaining < 0 && order.paymentStatus === 'UNPAID',
                isUpcoming: daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 && order.paymentStatus === 'UNPAID'
            }
        })

        return NextResponse.json({
            orders: enrichedOrders,
            stats,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        })

    } catch (error: any) {
        console.error('Erreur lors de la récupération des commandes en dépôt:', error)
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        )
    }
}
