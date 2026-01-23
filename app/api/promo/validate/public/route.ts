import { logger } from '@/lib/logger'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET /api/promo/validate/public - Valider un code promo (accessible en mode invité)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const totalAmount = parseFloat(searchParams.get('totalAmount') || '0')
    const itemCount = parseInt(searchParams.get('itemCount') || '0')

    if (!code) {
      return NextResponse.json({ error: "Code promo manquant" }, { status: 400 })
    }

    const promo = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!promo) {
      return NextResponse.json({ error: "Code promo invalide" }, { status: 404 })
    }

    if (promo.statut !== 'ACTIF') {
      return NextResponse.json({ error: "Ce code promo n'est pas actif" }, { status: 400 })
    }

    const now = new Date()
    if (promo.startDate && now < promo.startDate) {
      return NextResponse.json({ error: `Ce code promo sera valide à partir du ${promo.startDate.toLocaleDateString('fr-FR')}` }, { status: 400 })
    }
    if (promo.endDate && now > promo.endDate) {
      return NextResponse.json({ error: "Ce code promo a expiré" }, { status: 400 })
    }

    if (itemCount < promo.quantiteMinimale) {
      return NextResponse.json({ error: `Quantité minimale d'articles non atteinte (${promo.quantiteMinimale})` }, { status: 400 })
    }

    let discountAmount = 0
    if (promo.taux.includes('%')) {
      const percentage = parseFloat(promo.taux.replace('%', '')) / 100
      discountAmount = totalAmount * percentage
    } else {
      discountAmount = parseFloat(promo.taux)
    }

    return NextResponse.json({
      success: true,
      promoCode: promo.code,
      discount: discountAmount,
      message: `Code promo "${promo.code}" appliqué. Réduction: ${discountAmount.toLocaleString()} F CFA`
    }, { status: 200 })

  } catch (error: any) {
    logger.error("Error validating promo code:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation du code promo: " + error.message },
      { status: 500 }
    )
  }
}


