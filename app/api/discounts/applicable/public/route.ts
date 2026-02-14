import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allowGuest } from "@/lib/auth-guard"
import { ClientType } from "@prisma/client"
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/discounts/applicable/public - Récupérer les remises applicables (accessible en mode invité)
export const GET = allowGuest(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const workTitle = searchParams.get('workTitle')
    const quantity = parseInt(searchParams.get('quantity') || '1')

    // Déterminer le type de client
    // 1. Priorité: Contexte administrateur/sécurisé (si connecté)
    // 2. Fallback: Paramètre URL (pour simulation ou invité explicite)
    // 3. Défaut: 'particulier' (standard pour invité)
    // Note: Le paramètre 'Client' envoyé par le frontend est mappé à 'particulier' ou ignoré si authentifié

    let clientType = 'particulier'; // Défaut

    if (context.isAuthenticated && context.user.clientType) {
      clientType = context.user.clientType;
    } else {
      const paramType = searchParams.get('clientType');
      if (paramType && paramType !== 'Client') { // 'Client' est la valeur hardcodée du frontend invité
        clientType = paramType;
      }
    }

    if (!workId && !workTitle) {
      return NextResponse.json({ error: "workId ou workTitle requis" }, { status: 400 })
    }

    // Récupérer les remises applicables
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
        client: clientType, // Utilise le type réel (ex: 'grossiste')
        quantiteMin: { lte: quantity },
        OR: finalWorkTitle ? [
          { livre: finalWorkTitle },
          { livre: { contains: finalWorkTitle, mode: 'insensitive' } }
        ] : []
      },
      orderBy: { quantiteMin: 'desc' }
    })

    // Trouver la remise la plus avantageuse
    let bestDiscount = null
    if (discounts.length > 0) {
      bestDiscount = discounts[0]
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
})


