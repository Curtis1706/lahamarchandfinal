import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// PUT /api/representant/authors/[id]/validate - Valider ou rejeter un auteur
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const authorId = params.id
    const body = await request.json()
    const { status, reason } = body

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Vérifier que l'auteur existe
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Auteur non trouvé' },
        { status: 404 }
      )
    }

    if (author.role !== 'AUTEUR') {
      return NextResponse.json(
        { error: 'Utilisateur non autorisé' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de l'auteur
    const updatedAuthor = await prisma.user.update({
      where: { id: authorId },
      data: {
        status: status as 'ACTIVE' | 'INACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Créer une notification pour l'auteur
    await prisma.notification.create({
      data: {
        userId: authorId,
        title: status === 'ACTIVE' ? 'Compte validé' : 'Compte rejeté',
        message: status === 'ACTIVE' 
          ? 'Votre compte a été validé par votre représentant. Vous pouvez maintenant accéder à toutes les fonctionnalités.'
          : `Votre compte a été rejeté.${reason ? ` Raison: ${reason}` : ''}`,
        type: 'ACCOUNT_STATUS',
        isRead: false
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: status === 'ACTIVE' ? 'VALIDATE_AUTHOR' : 'REJECT_AUTHOR',
        details: `Auteur ${status === 'ACTIVE' ? 'validé' : 'rejeté'}: ${author.name} (${author.email})`,
        metadata: {
          authorId: author.id,
          authorName: author.name,
          authorEmail: author.email,
          newStatus: status,
          reason: reason || null
        }
      }
    })

    return NextResponse.json({
      message: `Auteur ${status === 'ACTIVE' ? 'validé' : 'rejeté'} avec succès`,
      author: updatedAuthor
    })

  } catch (error: any) {
    console.error('Erreur lors de la validation de l\'auteur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
