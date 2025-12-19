import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/auteur/recipients - Récupérer les destinataires disponibles pour l'auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'AUTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Les auteurs peuvent communiquer avec :
    // 1. Le PDG
    // 2. Leur représentant (s'ils en ont un)
    const recipients = []

    // Récupérer le PDG
    const pdg = await prisma.user.findFirst({
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

    if (pdg) {
      recipients.push(pdg)
    }

    // Récupérer le représentant de l'auteur s'il en a un
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        representantId: true
      }
    })

    if (author?.representantId) {
      const representant = await prisma.user.findUnique({
        where: { id: author.representantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      if (representant) {
        recipients.push(representant)
      }
    }

    return NextResponse.json({ recipients })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des destinataires:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

