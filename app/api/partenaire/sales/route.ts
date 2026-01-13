import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/sales - Liste des ventes (StockMovement type PARTNER_SALE)
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

    // Récupérer les mouvements de stock de type PARTNER_SALE
    const movements = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'PARTNER_SALE'
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true // Inclure le prix du livre
          }
        }
      }
    })

    // Transformer pour l'UI (quantity positive)
    const sales = movements.map(m => {
      const quantity = Math.abs(m.quantity)
      const unitPrice = m.unitPrice ?? m.work.price ?? 0
      const totalAmount = m.totalAmount ?? (unitPrice * quantity)
      
      return {
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        work: {
          id: m.work.id,
          title: m.work.title,
          isbn: m.work.isbn,
          price: m.work.price
        },
        quantity, // Quantité positive pour l'affichage
        unitPrice,
        totalAmount,
        reference: m.reference,
        reason: m.reason
      }
    })

    return NextResponse.json({ sales, total: sales.length })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des ventes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
