import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user: any = await (prisma.user as any).findUnique({
      where: { id: session.user.id },
      include: {
        discipline: { select: { id: true, name: true } },
        clients: {
          include: {
            department: { select: { id: true, name: true } }
          }
        }
      }
    })

    // Si c'est un client, on récupère aussi les infos de son représentant s'il en a un
    if (user && user.role === 'CLIENT' && user.clients && user.clients.length > 0) {
      for (const client of user.clients) {
        if (client.representantId) {
          (client as any).representant = await (prisma.user as any).findUnique({
            where: { id: client.representantId },
            select: { id: true, name: true, email: true, phone: true }
          })
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Retourner le profil sans le mot de passe
    const { password: _, ...userProfile } = user

    return NextResponse.json(userProfile)

  } catch (error: any) {
    logger.error('❌ Erreur lors de la récupération du profil:', error)
    return NextResponse.json({
      error: 'Erreur lors de la récupération du profil: ' + error.message
    }, { status: 500 })
  }
}

// PUT /api/users/profile - Mettre à jour le profil de l'utilisateur connecté
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, profileImage } = body

    // Préparer les données à mettre à jour
    const updateData: any = {}

    // Champs de base
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    // Mapping profileImage vers image
    if (profileImage !== undefined) updateData.image = profileImage

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: {
        discipline: { select: { id: true, name: true } }
      }
    })

    // Retourner le profil sans le mot de passe
    const { password: _, ...userProfile } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userProfile
    })

  } catch (error: any) {
    logger.error('❌ Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour du profil: ' + error.message
    }, { status: 500 })
  }
}

