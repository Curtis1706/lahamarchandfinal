import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET - Récupérer les paiements et royalties de l'auteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - Author role required" }, { status: 403 })
    }

    console.log("💰 Fetching author payments for:", user.name)

    const userId = user.id

    // Récupérer toutes les royalties de l'auteur
    const royalties = await prisma.royalty.findMany({
      where: { userId: userId },
      include: {
        work: {
          select: {
            title: true,
            discipline: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transformer les données pour l'affichage
    const formattedPayments = royalties.map(royalty => ({
      id: royalty.id,
      amount: royalty.amount,
      paid: royalty.paid,
      createdAt: royalty.createdAt,
      workTitle: royalty.work.title,
      workDiscipline: royalty.work.discipline.name,
      status: royalty.paid ? "Payé" : "En attente",
      paymentMethod: "Virement bancaire", // Méthode par défaut
      period: formatPeriod(royalty.createdAt)
    }))

    // Calculer les statistiques
    const stats = {
      totalRoyalties: royalties.reduce((sum, r) => sum + r.amount, 0),
      paidRoyalties: royalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0),
      pendingRoyalties: royalties.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0),
      totalPayments: royalties.filter(r => r.paid).length,
      pendingPayments: royalties.filter(r => !r.paid).length
    }

    // Générer des données mensuelles pour les graphiques
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
      
      const monthRoyalties = royalties.filter(royalty => {
        const royaltyDate = new Date(royalty.createdAt)
        return royaltyDate.getMonth() === monthDate.getMonth() && 
               royaltyDate.getFullYear() === monthDate.getFullYear()
      })
      
      const monthPaid = monthRoyalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0)
      const monthPending = monthRoyalties.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0)
      
      monthlyData.push({
        month: monthName,
        paid: monthPaid,
        pending: monthPending,
        total: monthPaid + monthPending
      })
    }

    // Récupérer les paiements récents (derniers 10)
    const recentPayments = formattedPayments.slice(0, 10)

    console.log(`💰 Found ${royalties.length} royalties for author`)

    return NextResponse.json({
      payments: formattedPayments,
      recentPayments,
      stats,
      monthlyData
    })

  } catch (error) {
    console.error("❌ Error fetching author payments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Fonction utilitaire pour formater la période
function formatPeriod(date: Date) {
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]
  
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  return `${month} ${year}`
}



