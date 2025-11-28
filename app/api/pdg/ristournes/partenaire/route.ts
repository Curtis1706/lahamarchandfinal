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

    // Récupérer les ristournes partenaires depuis la base de données
    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const rebates = await prisma.partnerRebate.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        validatedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transformer en format pour l'affichage
    const ristournes = rebates.map(rebate => {
      const statutMap: Record<string, string> = {
        'PENDING': 'En attente',
        'VALIDATED': 'Validé',
        'PAID': 'Payé',
        'CANCELLED': 'Annulé'
      }
      
      return {
        id: rebate.id,
        reference: `RST-${rebate.id.slice(-8).toUpperCase()}`,
        partnerId: rebate.partnerId,
        partnerName: rebate.partner?.name || "Partenaire inconnu",
        versement: rebate.amount,
        retrait: 0, // Pour l'instant, pas de retraits
        statut: statutMap[rebate.status] || rebate.status,
        creeLe: rebate.createdAt.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        createdAt: rebate.createdAt,
        rate: rebate.rate,
        orderId: rebate.orderId
      }
    })

    // Filtrer par statut si fourni
    let filteredRistournes = ristournes
    if (status && status !== "all") {
      const statusMap: Record<string, string> = {
        'Payé': 'PAID',
        'En attente': 'PENDING',
        'Validé': 'VALIDATED',
        'Annulé': 'CANCELLED'
      }
      const dbStatus = statusMap[status] || status
      filteredRistournes = ristournes.filter(r => {
        const rebate = rebates.find(b => b.id === r.id)
        return rebate?.status === dbStatus
      })
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

