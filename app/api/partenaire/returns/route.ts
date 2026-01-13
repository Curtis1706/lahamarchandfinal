import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/returns - Liste des retours (StockMovement type PARTNER_RETURN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le partenaire (ownership safe)
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Récupérer les mouvements de stock de type PARTNER_RETURN
    const movements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_RETURN'
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        }
      }
    })

    // Transformer pour l'UI (quantity positive)
    const returns = movements.map(m => ({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      work: {
        id: m.work.id,
        title: m.work.title,
        isbn: m.work.isbn
      },
      quantity: Math.abs(m.quantity), // Quantité positive pour l'affichage
      unitPrice: m.unitPrice,
      totalAmount: m.totalAmount,
      reference: m.reference,
      reason: m.reason
    }))

    return NextResponse.json({ returns, total: returns.length })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des retours:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
