import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/recipients - Récupérer les destinataires disponibles pour le représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const recipients: Array<{
      id: string
      name: string
      email: string
      role: string
    }> = []

    // 1. Récupérer le PDG
    const pdgUsers = await prisma.user.findMany({
      where: {
        role: 'PDG',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    recipients.push(...pdgUsers)

    // 2. Récupérer les partenaires de la zone du représentant
    const partners = await prisma.partner.findMany({
      where: {
        representantId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    })

    // Ajouter les utilisateurs partenaires actifs
    partners.forEach(partner => {
      if (partner.user && partner.user.status === 'ACTIVE') {
        recipients.push({
          id: partner.user.id,
          name: partner.user.name,
          email: partner.user.email,
          role: partner.user.role
        })
      }
    })

    // Supprimer les doublons (au cas où)
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.id === recipient.id)
    )

    // Trier par rôle puis par nom
    uniqueRecipients.sort((a, b) => {
      if (a.role !== b.role) {
        // PDG en premier
        if (a.role === 'PDG') return -1
        if (b.role === 'PDG') return 1
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ recipients: uniqueRecipients })

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

