import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/users - Récupérer les utilisateurs (pour le PDG)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ 
        error: "Accès refusé - Seul le PDG peut accéder à cette ressource" 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Construire les filtres
    const where: any = {}
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Retourner les utilisateurs sans les mots de passe
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json({
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

