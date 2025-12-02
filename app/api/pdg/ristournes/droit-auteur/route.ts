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

    // Grouper les royalties par auteur
    const royaltiesByAuthor = royalties.reduce((acc, royalty) => {
      const authorId = royalty.userId
      if (!acc[authorId]) {
        acc[authorId] = {
          authorId: authorId,
          authorName: royalty.user.name,
          authorEmail: royalty.user.email,
          royalties: [],
          totalVersement: 0,
          totalRetrait: 0,
          totalPending: 0 // Total des royalties en attente
        }
      }
      
      acc[authorId].royalties.push(royalty)
      if (royalty.paid) {
        acc[authorId].totalVersement += royalty.amount
      } else {
        acc[authorId].totalPending += royalty.amount
      }
      // Pour l'instant, pas de retraits
      acc[authorId].totalRetrait = 0
      
      return acc
    }, {} as Record<string, any>)

    // Transformer en format pour l'affichage
    const droitsAuteur = Object.values(royaltiesByAuthor).map((authorData: any) => {
      const latestRoyalty = authorData.royalties[0]
      const totalRoyalties = authorData.totalVersement + authorData.totalPending
      const statut = authorData.royalties.some((r: any) => r.paid) ? "Payé" : "En attente"
      
      return {
        id: authorData.authorId,
        reference: `DA-${authorData.authorId.slice(-8).toUpperCase()}`,
        authorId: authorData.authorId,
        authorName: authorData.authorName,
        versement: totalRoyalties, // Afficher le total (payé + en attente)
        retrait: authorData.totalRetrait,
        statut: statut,
        creeLe: latestRoyalty.createdAt.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
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
    console.error("Error fetching author royalties:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

