import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// POST - Marquer des royalties comme payées
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seuls les PDG et les représentants peuvent marquer les royalties comme payées
    if (!["PDG", "REPRESENTANT"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - PDG or REPRESENTANT role required" }, { status: 403 })
    }

    const body = await request.json()
    const { royaltyIds, paymentMethod = "Virement bancaire", paymentDate } = body

    if (!royaltyIds || !Array.isArray(royaltyIds) || royaltyIds.length === 0) {
      return NextResponse.json({ error: "Missing required field: royaltyIds (array)" }, { status: 400 })
    }

    console.log(`💰 Marking royalties as paid: ${royaltyIds.length} royalties`)

    // Vérifier que toutes les royalties existent et ne sont pas déjà payées
    const royalties = await prisma.royalty.findMany({
      where: {
        id: { in: royaltyIds },
        paid: false
      },
      include: {
        work: {
          include: {
            discipline: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (royalties.length !== royaltyIds.length) {
      return NextResponse.json({ 
        error: "Some royalties not found or already paid" 
      }, { status: 400 })
    }

    // Marquer les royalties comme payées
    const updateResult = await prisma.royalty.updateMany({
      where: {
        id: { in: royaltyIds }
      },
      data: {
        paid: true
      }
    })

    // Calculer le montant total payé
    const totalAmount = royalties.reduce((sum, royalty) => sum + royalty.amount, 0)

    // Créer des notifications pour les auteurs
    const authorIds = [...new Set(royalties.map(r => r.userId))]
    
    for (const authorId of authorIds) {
      const authorRoyalties = royalties.filter(r => r.userId === authorId)
      const authorTotal = authorRoyalties.reduce((sum, r) => sum + r.amount, 0)

      // Créer une notification pour l'auteur
      try {
        await prisma.notification.create({
          data: {
            userId: authorId,
            title: "💰 Paiement de droits d'auteur reçu",
            message: `Vous avez reçu un paiement de ${authorTotal.toLocaleString()} FCFA pour vos droits d'auteur. ${authorRoyalties.length} œuvre(s) concernée(s).`,
            type: "ROYALTY_PAYMENT",
            data: JSON.stringify({
              amount: authorTotal,
              royaltiesCount: authorRoyalties.length,
              paidAt: new Date().toISOString(),
              royaltyIds: authorRoyalties.map(r => r.id)
            })
          }
        })
        console.log(`✅ Notification créée: Paiement de ${authorTotal} FCFA pour l'auteur ${authorId}`)
      } catch (notifError) {
        console.error(`⚠️ Erreur création notification pour auteur ${authorId}:`, notifError)
      }
    }

    console.log(`✅ Marked ${updateResult.count} royalties as paid (${totalAmount} FCFA)`)

    return NextResponse.json({
      message: "Royalties marked as paid successfully",
      paidCount: updateResult.count,
      totalAmount,
      paymentMethod,
      paymentDate: paymentDate || new Date().toISOString(),
      royalties: royalties.map(r => ({
        id: r.id,
        workTitle: r.work.title,
        authorName: r.user.name,
        amount: r.amount
      }))
    })

  } catch (error) {
    console.error("❌ Error marking royalties as paid:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// GET - Récupérer l'historique des paiements de royalties
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seuls les PDG et les représentants peuvent voir l'historique des paiements
    if (!["PDG", "REPRESENTANT"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden - PDG or REPRESENTANT role required" }, { status: 403 })
    }

    console.log(`💰 Fetching royalty payment history for: ${user.name}`)

    // Récupérer toutes les royalties payées
    const paidRoyalties = await prisma.royalty.findMany({
      where: { paid: true },
      include: {
        work: {
          include: {
            discipline: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculer les statistiques
    const stats = {
      totalPaid: paidRoyalties.length,
      totalAmount: paidRoyalties.reduce((sum, r) => sum + r.amount, 0),
      authorsCount: new Set(paidRoyalties.map(r => r.userId)).size,
      lastPayment: paidRoyalties.length > 0 ? paidRoyalties[0].createdAt : null
    }

    return NextResponse.json({
      payments: paidRoyalties,
      stats
    })

  } catch (error) {
    console.error("❌ Error fetching royalty payment history:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
