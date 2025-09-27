import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/finance - Récupérer les données financières
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux données financières
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    switch (type) {
      case 'overview':
        // Vue d'ensemble financière
        const overview = {
          totalRevenue: 0,
          totalOrders: 0,
          totalWorks: 0,
          totalPartners: 0,
          recentOrders: [],
          topWorks: []
        }

        return NextResponse.json(overview)

      case 'revenue':
        // Statistiques de revenus
        const revenue = {
          daily: [],
          monthly: [],
          yearly: []
        }

        return NextResponse.json(revenue)

      case 'orders':
        // Statistiques des commandes
        const orders = {
          total: 0,
          pending: 0,
          completed: 0,
          cancelled: 0
        }

        return NextResponse.json(orders)

      default:
        return NextResponse.json({ error: "Type de données non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des données financières:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
