import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/dashboard - Statistiques du dashboard partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Statistiques des commandes
    const ordersStats = await prisma.order.aggregate({
      where: {
        partnerId: partner.id
      },
      _count: {
        id: true
      }
    })

    const pendingOrders = await prisma.order.count({
      where: {
        partnerId: partner.id,
        status: 'PENDING'
      }
    })

    const completedOrders = await prisma.order.count({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED'
      }
    })

    // Calculer le chiffre d'affaires total
    const ordersWithItems = await prisma.order.findMany({
      where: {
        partnerId: partner.id,
        status: 'DELIVERED'
      },
      include: {
        items: true
      }
    })

    const totalRevenue = ordersWithItems.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    // Nombre d'œuvres disponibles (toutes les œuvres validées)
    const availableWorks = await prisma.work.count({
      where: {
        status: 'PUBLISHED'
      }
    })

    const stats = {
      totalOrders: ordersStats._count.id,
      pendingOrders,
      completedOrders,
      totalRevenue,
      availableWorks
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

