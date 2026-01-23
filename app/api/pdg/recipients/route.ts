import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/recipients - Récupérer les destinataires disponibles pour le PDG
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Le PDG peut communiquer avec :
    // 1. Les représentants (REPRESENTANT)
    // 2. Les écoles (CLIENT avec Partner.type = "école")
    // 3. Les partenaires (PARTENAIRE)
    // 4. Les auteurs (AUTEUR)
    // 5. Les concepteurs (CONCEPTEUR)

    // Récupérer les utilisateurs actifs avec leurs rôles (limité pour performance)
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: {
          not: session.user.id // Exclure le PDG lui-même
        },
        role: {
          in: ['REPRESENTANT', 'PARTENAIRE', 'AUTEUR', 'CONCEPTEUR', 'CLIENT', 'INVITE']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ],
      take: 500 // Limiter à 500 destinataires pour la messagerie
    })

    // Pour les utilisateurs CLIENT, vérifier s'ils sont des écoles (via Partner)
    const clientIds = allUsers.filter(u => u.role === 'CLIENT').map(u => u.id)
    const partners = await prisma.partner.findMany({
      where: {
        userId: { in: clientIds },
        type: { in: ['école', 'École', 'ECOLE'] }
      },
      select: {
        userId: true,
        type: true,
        name: true
      }
    })

    const schoolUserIds = new Set(partners.map(p => p.userId))

    // Enrichir les utilisateurs avec des informations supplémentaires
    const recipients = allUsers.map(user => {
      // Déterminer la catégorie
      let category = 'AUTRE'
      if (user.role === 'REPRESENTANT') {
        category = 'REPRESENTANT'
      } else if (user.role === 'PARTENAIRE') {
        category = 'PARTENAIRE'
      } else if (user.role === 'AUTEUR') {
        category = 'AUTEUR'
      } else if (user.role === 'CONCEPTEUR') {
        category = 'CONCEPTEUR'
      } else if (user.role === 'CLIENT' && schoolUserIds.has(user.id)) {
        category = 'ECOLE'
      } else if (user.role === 'CLIENT') {
        category = 'CLIENT'
      }

      return {
        ...user,
        category
      }
    })

    // Organiser par catégorie
    const recipientsByCategory = {
      REPRESENTANT: recipients.filter(r => r.category === 'REPRESENTANT'),
      ECOLE: recipients.filter(r => r.category === 'ECOLE'),
      PARTENAIRE: recipients.filter(r => r.category === 'PARTENAIRE'),
      AUTEUR: recipients.filter(r => r.category === 'AUTEUR'),
      CONCEPTEUR: recipients.filter(r => r.category === 'CONCEPTEUR'),
      CLIENT: recipients.filter(r => r.category === 'CLIENT'),
      AUTRE: recipients.filter(r => r.category === 'AUTRE')
    }

    return NextResponse.json({
      recipients,
      recipientsByCategory,
      stats: {
        representants: recipientsByCategory.REPRESENTANT.length,
        ecoles: recipientsByCategory.ECOLE.length,
        partenaires: recipientsByCategory.PARTENAIRE.length,
        auteurs: recipientsByCategory.AUTEUR.length,
        concepteurs: recipientsByCategory.CONCEPTEUR.length,
        total: recipients.length
      }
    })

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des destinataires:', error)
    logger.error('Stack trace:', error.stack)
    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

