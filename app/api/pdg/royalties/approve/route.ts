import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST /api/pdg/royalties/approve - Approuver des royalties (pending -> approved)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { royaltyIds } = body

    if (!royaltyIds || !Array.isArray(royaltyIds) || royaltyIds.length === 0) {
      return NextResponse.json({ error: 'royaltyIds (array) est requis' }, { status: 400 })
    }

    // Vérifier que toutes les royalties existent et sont en attente
    const royalties = await prisma.royalty.findMany({
      where: {
        id: { in: royaltyIds },
        approved: false,
        paid: false
      }
    })

    if (royalties.length !== royaltyIds.length) {
      return NextResponse.json({ 
        error: 'Certaines royalties ne sont pas en attente ou n\'existent pas' 
      }, { status: 400 })
    }

    // Approuver les royalties
    const updated = await prisma.royalty.updateMany({
      where: {
        id: { in: royaltyIds }
      },
      data: {
        approved: true,
        approvedAt: new Date()
      }
    })

    // Créer des notifications pour les auteurs concernés
    const authorIds = [...new Set(royalties.map(r => r.userId))]
    
    for (const authorId of authorIds) {
      const authorRoyalties = royalties.filter(r => r.userId === authorId)
      const totalAmount = authorRoyalties.reduce((sum, r) => sum + r.amount, 0)
      
      await prisma.notification.create({
        data: {
          userId: authorId,
          title: 'Royalties approuvées',
          message: `Vos royalties d'un montant total de ${totalAmount.toLocaleString()} F CFA ont été approuvées et sont maintenant disponibles pour retrait.`,
          type: 'ROYALTY_APPROVED',
          data: JSON.stringify({ 
            royaltyIds: authorRoyalties.map(r => r.id),
            totalAmount 
          })
        }
      })
    }

    return NextResponse.json({
      message: `${updated.count} royalties approuvées avec succès`,
      count: updated.count
    })

  } catch (error: any) {
    console.error("❌ Error approving royalties:", error)
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}


