import { logger } from '@/lib/logger'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/discounts/applicable - Récupérer les remises applicables pour un livre et un type de client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const workTitle = searchParams.get('workTitle')
    const clientType = searchParams.get('clientType') // CLIENT, PARTENAIRE, REPRESENTANT
    const quantity = parseInt(searchParams.get('quantity') || '1')

    if (!workId && !workTitle) {
      return NextResponse.json({ error: "workId ou workTitle requis" }, { status: 400 })
    }

    // Déterminer le type de client basé sur le rôle de l'utilisateur si non spécifié
    let finalClientType = clientType
    if (!finalClientType) {
      if (session.user.role === "PARTENAIRE") {
        finalClientType = "Partenaire"
      } else if (session.user.role === "REPRESENTANT") {
        finalClientType = "Représentant"
      } else {
        finalClientType = "Client"
      }
    }

    // Récupérer les remises applicables
    // Si workId est fourni, récupérer le titre du livre depuis la base
    let finalWorkTitle = workTitle
    if (workId && !workTitle) {
      try {
        const work = await prisma.work.findUnique({
          where: { id: workId },
          select: { title: true }
        })
        if (work) {
          finalWorkTitle = work.title
        }
      } catch (error) {
        logger.error("Error fetching work title:", error)
      }
    }

    const discounts = await prisma.discount.findMany({
      where: {
        statut: "ACTIF",
        client: finalClientType,
        quantiteMin: { lte: quantity },
        OR: finalWorkTitle ? [
          { livre: finalWorkTitle },
          { livre: { contains: finalWorkTitle, mode: 'insensitive' } }
        ] : []
      },
      orderBy: { quantiteMin: 'desc' } // Prioriser les remises avec quantité minimale plus élevée
    })

    // Trouver la remise la plus avantageuse
    let bestDiscount = null
    if (discounts.length > 0) {
      bestDiscount = discounts[0] // La première est la plus avantageuse (quantité minimale la plus élevée)
    }

    return NextResponse.json({
      applicable: bestDiscount ? {
        id: bestDiscount.id,
        type: bestDiscount.type,
        reduction: bestDiscount.reduction,
        quantiteMin: bestDiscount.quantiteMin,
        description: bestDiscount.description
      } : null,
      allApplicable: discounts.map(d => ({
        id: d.id,
        type: d.type,
        reduction: d.reduction,
        quantiteMin: d.quantiteMin,
        description: d.description
      }))
    }, { status: 200 })

  } catch (error: any) {
    logger.error("Error fetching applicable discounts:", error)
    return NextResponse.json({ 
      error: error.message || "Erreur lors de la récupération des remises" 
    }, { status: 500 })
  }
}

