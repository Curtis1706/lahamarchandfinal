import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/discounts/applicable/public - Récupérer les remises applicables (accessible en mode invité)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const workTitle = searchParams.get('workTitle')
    const clientType = searchParams.get('clientType') || 'Client' // Par défaut "Client" pour les invités
    const quantity = parseInt(searchParams.get('quantity') || '1')

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
        console.error("Error fetching work title:", error)
      }
    }

    const discounts = await prisma.discount.findMany({
      where: {
        statut: "ACTIF",
        client: clientType,
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
    console.error("Error fetching applicable discounts:", error)
    return NextResponse.json({ 
      error: error.message || "Erreur lors de la récupération des remises" 
    }, { status: 500 })
  }
}


