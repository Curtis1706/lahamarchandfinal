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

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      include: {
        user: true
      }
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
          },
          include: {
            user: true
          }
        })
        console.log("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        console.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
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

