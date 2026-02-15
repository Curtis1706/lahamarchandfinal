import { logger } from '@/lib/logger'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/ristournes/droit-auteur - Récupérer les droits d'auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Construire les filtres
    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Récupérer toutes les royalties
    const royalties = await prisma.royalty.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        work: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Grouper les royalties par œuvre (livre) et auteur
    const royaltiesByWork = royalties.reduce((acc, royalty) => {
      // Safety check for relations
      if (!royalty.work || !royalty.user) {
        return acc
      }

      const key = `${royalty.workId}-${royalty.userId}`

      if (!acc[key]) {
        acc[key] = {
          workId: royalty.workId,
          workTitle: royalty.work.title,
          workIsbn: royalty.work.isbn,
          authorId: royalty.userId,
          authorName: royalty.user.name,
          authorEmail: royalty.user.email,
          royalties: [],
          totalGenerated: 0, // Total généré (Versement)
          totalPaid: 0,      // Total payé (Retrait)
          totalPending: 0    // Total en attente
        }
      }

      acc[key].royalties.push(royalty)

      // Versement = Total généré (toutes les royalties)
      acc[key].totalGenerated += royalty.amount

      if (royalty.paid) {
        // Retrait = Royalties payées
        acc[key].totalPaid += royalty.amount
      } else {
        acc[key].totalPending += royalty.amount
      }

      return acc
    }, {} as Record<string, any>)

    // Transformer en format pour l'affichage
    const droitsAuteur = Object.values(royaltiesByWork).map((data: any) => {
      const latestRoyalty = data.royalties[0]
      const statut = data.totalPending > 0 ? "En attente" : "Payé"

      return {
        id: `${data.workId}-${data.authorId}`,
        reference: data.workTitle, // Afficher le titre du livre comme référence
        authorId: data.authorId,
        authorName: data.authorName,
        versement: data.totalGenerated, // Total généré par le livre
        retrait: data.totalPaid,        // Total déjà payé à l'auteur pour ce livre
        statut: statut,
        creeLe: latestRoyalty.createdAt.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        createdAt: latestRoyalty.createdAt
      }
    })

    // Filtrer par statut si fourni
    let filteredDroits = droitsAuteur
    if (status && status !== "all") {
      filteredDroits = droitsAuteur.filter(d => d.statut === status)
    }

    // Filtrer par recherche si fourni
    if (search) {
      filteredDroits = filteredDroits.filter(d =>
        d.reference.toLowerCase().includes(search.toLowerCase()) ||
        d.authorName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les statistiques
    // Le versement inclut maintenant toutes les royalties (payées + en attente)
    const totalVersements = filteredDroits
      .reduce((sum, d) => sum + d.versement, 0)

    const totalRetraits = filteredDroits
      .reduce((sum, d) => sum + d.retrait, 0)

    const solde = totalVersements - totalRetraits

    return NextResponse.json({
      droitsAuteur: filteredDroits,
      stats: {
        versements: totalVersements,
        retraits: totalRetraits,
        solde: solde
      },
      total: filteredDroits.length
    })

  } catch (error) {
    logger.error("Error fetching author royalties:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

