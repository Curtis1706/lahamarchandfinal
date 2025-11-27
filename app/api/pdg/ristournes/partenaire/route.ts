import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/ristournes/partenaire - Récupérer les ristournes partenaires
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Récupérer toutes les commandes des partenaires
    const where: any = {
      partnerId: { not: null },
      status: { in: ["VALIDATED", "PROCESSING", "SHIPPED", "DELIVERED"] }
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer les ristournes (par exemple 10% du montant total des commandes)
    const rebateRate = 0.10
    const ristournes = orders.map(order => {
      const totalAmount = order.total || order.subtotal || 0
      const rebateAmount = totalAmount * rebateRate
      
      return {
        id: order.id,
        reference: `RST-${order.id.slice(-8).toUpperCase()}`,
        partnerId: order.partnerId,
        partnerName: order.partner?.name || "Partenaire inconnu",
        versement: rebateAmount, // Ristourne calculée
        retrait: 0, // Pour l'instant, pas de retraits
        statut: order.status === "DELIVERED" ? "Payé" : "En attente",
        creeLe: order.createdAt.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        createdAt: order.createdAt
      }
    })

    // Filtrer par statut si fourni
    let filteredRistournes = ristournes
    if (status && status !== "all") {
      filteredRistournes = ristournes.filter(r => r.statut === status)
    }

    // Filtrer par recherche si fourni
    if (search) {
      filteredRistournes = filteredRistournes.filter(r =>
        r.reference.toLowerCase().includes(search.toLowerCase()) ||
        r.partnerName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les statistiques
    const totalVersements = filteredRistournes
      .filter(r => r.statut === "Payé")
      .reduce((sum, r) => sum + r.versement, 0)
    
    const totalRetraits = filteredRistournes
      .reduce((sum, r) => sum + r.retrait, 0)
    
    const solde = totalVersements - totalRetraits

    return NextResponse.json({
      ristournes: filteredRistournes,
      stats: {
        versements: totalVersements,
        retraits: totalRetraits,
        solde: solde
      },
      total: filteredRistournes.length
    })

  } catch (error) {
    console.error("Error fetching partner rebates:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

