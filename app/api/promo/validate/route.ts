import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/promo/validate - Valider un code promo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { code, items } = await request.json()

    if (!code) {
      return NextResponse.json({
        error: "Code promo requis",
        valid: false
      }, { status: 400 })
    }

    // Rechercher le code promo
    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase().trim() }
    })

    if (!promotion) {
      return NextResponse.json({
        error: "Code promo invalide",
        valid: false
      }, { status: 404 })
    }

    // Vérifier le statut
    if (promotion.statut !== 'ACTIF') {
      return NextResponse.json({
        error: "Ce code promo n'est plus actif",
        valid: false
      }, { status: 400 })
    }

    // Vérifier les dates de validité
    const now = new Date()
    if (promotion.startDate && new Date(promotion.startDate) > now) {
      return NextResponse.json({
        error: "Ce code promo n'est pas encore valide",
        valid: false
      }, { status: 400 })
    }

    if (promotion.endDate && new Date(promotion.endDate) < now) {
      return NextResponse.json({
        error: "Ce code promo a expiré",
        valid: false
      }, { status: 400 })
    }

    // Vérifier la quantité minimale si des items sont fournis
    if (items && Array.isArray(items) && items.length > 0) {
      const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)

      if (totalQuantity < promotion.quantiteMinimale) {
        return NextResponse.json({
          error: `Quantité minimale requise: ${promotion.quantiteMinimale} article(s)`,
          valid: false
        }, { status: 400 })
      }
    }

    // Calculer la réduction
    let discountAmount = 0
    const rawTaux = promotion.taux ? promotion.taux.toString().trim() : "0"

    // Déterminer le type de réduction de manière robuste
    // Si la chaîne contient "%", c'est un pourcentage
    const isPercentage = rawTaux.includes('%')
    const isFixedAmount = !isPercentage

    // Extraire la valeur numérique propre
    // Remplace les virgules par des points et ne garde que les chiffres/points
    const cleanValue = rawTaux.replace(/[^0-9.,]/g, '').replace(',', '.')
    const numericValue = parseFloat(cleanValue) || 0

    if (items && Array.isArray(items) && items.length > 0) {
      const totalPrice = items.reduce((sum: number, item: any) => {
        return sum + ((item.price || 0) * (item.quantity || 1))
      }, 0)

      if (isPercentage) {
        // Pourcentage : (Total * Valeur) / 100
        discountAmount = (totalPrice * numericValue) / 100
      } else {
        // Montant fixe : Valeur brute (plafonnée au total)
        discountAmount = Math.min(numericValue, totalPrice)
      }
    } else {
      // Cas sans items (estimation)
      if (isFixedAmount) {
        discountAmount = numericValue
      }
    }

    return NextResponse.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        libelle: promotion.libelle,
        taux: promotion.taux,
        discountAmount: Math.round(discountAmount), // Arrondir proprement
        isFixedAmount: isFixedAmount
      }
    })

  } catch (error: any) {
    logger.error("Error validating promo code:", error)
    return NextResponse.json({
      error: "Erreur lors de la validation du code promo: " + error.message,
      valid: false
    }, { status: 500 })
  }
}

