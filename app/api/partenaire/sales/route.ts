import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/sales - Ventes réalisées par le partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const method = searchParams.get('method') || ''
    const search = searchParams.get('search') || ''

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Récupérer les commandes livrées du partenaire (considérées comme des ventes)
    const whereClause: any = {
      partnerId: partner.id,
      status: 'DELIVERED'
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                discipline: {
                  select: {
                    name: true
                  }
                },
                author: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transformer les données pour l'affichage des ventes
    const salesData = orders.map(order => ({
      id: order.id,
      reference: order.id,
      clientName: order.user?.name || 'Client inconnu',
      clientPhone: order.user?.email || 'N/A',
      qty: order.items.reduce((sum, item) => sum + item.quantity, 0),
      montant: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      statut: 'Validée',
      compte: 'Partenaire',
      paiements: 'Payé',
      methode: 'Mobile Money', // TODO: Récupérer la vraie méthode de paiement
      creeLe: order.createdAt.toISOString().split('T')[0],
      validePar: 'PDG',
      modifieLe: order.updatedAt.toISOString().split('T')[0],
      items: order.items.map(item => ({
        id: item.id,
        work: {
          id: item.work.id,
          title: item.work.title,
          isbn: item.work.isbn || 'N/A',
          discipline: item.work.discipline?.name || 'Non définie',
          author: item.work.author?.name || 'Auteur inconnu'
        },
        quantity: item.quantity,
        price: item.price
      }))
    }))

    // Filtrer les données selon les paramètres
    let filteredSales = salesData

    if (status && status !== 'all') {
      filteredSales = filteredSales.filter(sale => sale.statut === status)
    }

    if (type && type !== 'all') {
      // TODO: Implémenter le filtrage par type
    }

    if (method && method !== 'all') {
      filteredSales = filteredSales.filter(sale => sale.methode === method)
    }

    if (search) {
      filteredSales = filteredSales.filter(sale => 
        sale.reference.toLowerCase().includes(search.toLowerCase()) ||
        sale.clientName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les statistiques
    const totalVentes = filteredSales.length
    const totalRetours = 0 // TODO: Implémenter la logique des retours
    const montantNet = filteredSales.reduce((sum, sale) => sum + sale.montant, 0) - (totalRetours * 5000)
    const performance = totalVentes > 0 ? Math.round((totalVentes / (totalVentes + totalRetours)) * 100) : 0

    return NextResponse.json({
      sales: filteredSales,
      stats: {
        totalVentes,
        totalRetours,
        montantNet,
        performance
      },
      total: filteredSales.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des ventes partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

