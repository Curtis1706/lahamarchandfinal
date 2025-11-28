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

    // Le PDG peut communiquer avec tous les utilisateurs actifs
    const recipients = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: {
          not: session.user.id // Exclure le PDG lui-même
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

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

