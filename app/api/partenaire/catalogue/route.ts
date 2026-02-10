import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/catalogue - Catalogue des œuvres disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''
    const price = searchParams.get('price') || ''

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        logger.debug("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    const whereClause: any = {
      status: 'PUBLISHED'
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (discipline && discipline !== 'all') {
      whereClause.discipline = {
        name: { contains: discipline, mode: 'insensitive' }
      }
    }

    const works = await prisma.work.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour l'affichage
    let catalogueData = works.map(work => {
      let coverImage = null;
      if (work.files) {
        try {
          const filesData = typeof work.files === 'string' ? JSON.parse(work.files) : work.files;
          if (filesData.coverImage) {
            coverImage = filesData.coverImage;
          }
        } catch (e) {
          console.error("Erreur parsing files:", e);
        }
      }

      return {
        id: work.id,
        title: work.title,
        isbn: work.isbn || 'N/A',
        discipline: work.discipline?.name || 'Non définie',
        author: work.author?.name || 'Auteur inconnu',
        price: work.price || 0,
        available: work.stock > 0,
        stock: work.stock || 0,
        description: work.description || 'Description non disponible',
        coverImage: coverImage
      };
    })

    // Filtrer par prix si nécessaire
    if (price && price !== 'all') {
      catalogueData = catalogueData.filter(work => {
        switch (price) {
          case 'low':
            return work.price < 3500
          case 'medium':
            return work.price >= 3500 && work.price < 4500
          case 'high':
            return work.price >= 4500
          default:
            return true
        }
      })
    }

    return NextResponse.json({
      works: catalogueData,
      total: catalogueData.length
    })

  } catch (error: any) {
    logger.error('Erreur lors de la récupération du catalogue partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

