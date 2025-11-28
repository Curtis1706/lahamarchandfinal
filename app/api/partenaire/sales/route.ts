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

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
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
      statut: order.status === 'DELIVERED' ? 'Validée' : order.status === 'SHIPPED' ? 'En cours' : 'En attente',
      compte: 'Partenaire',
      paiements: order.status === 'DELIVERED' ? 'Payé' : 'En attente',
      methode: 'À définir', // La méthode de paiement devra être ajoutée au modèle Order
      creeLe: order.createdAt.toISOString().split('T')[0],
      validePar: 'PDG',
      modifieLe: order.updatedAt.toISOString().split('T')[0],
      type: 'vente', // Type de transaction (toutes les commandes sont des ventes pour l'instant)
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

    if (status && status !== 'all' && status !== 'tous') {
      filteredSales = filteredSales.filter(sale => sale.statut.toLowerCase().includes(status.toLowerCase()))
    }

    if (type && type !== 'all' && type !== 'tous') {
      filteredSales = filteredSales.filter(sale => sale.type === type)
    }

    if (method && method !== 'all' && method !== 'tous') {
      filteredSales = filteredSales.filter(sale => sale.methode.toLowerCase().includes(method.toLowerCase()))
    }

    if (search) {
      filteredSales = filteredSales.filter(sale => 
        sale.reference.toLowerCase().includes(search.toLowerCase()) ||
        sale.clientName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les statistiques
    const ventes = filteredSales.filter(sale => sale.type === 'vente')
    const retours = filteredSales.filter(sale => sale.type === 'retour')
    const totalVentes = ventes.length
    const totalRetours = retours.length
    const montantVentes = ventes.reduce((sum, sale) => sum + sale.montant, 0)
    const montantRetours = retours.reduce((sum, sale) => sum + Math.abs(sale.montant), 0)
    const montantNet = montantVentes - montantRetours
    const performance = totalVentes > 0 ? Math.round((totalVentes / (totalVentes + totalRetours)) * 100) : 100

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

