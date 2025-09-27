import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// PUT /api/representant/works/[id]/transmit - Transmettre une œuvre au PDG
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const workId = params.id
    const body = await request.json()
    const { notes } = body

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: {
        id: true,
        title: true,
        status: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!work) {
      return NextResponse.json(
        { error: 'Œuvre non trouvée' },
        { status: 404 }
      )
    }

    if (work.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cette œuvre ne peut pas être transmise' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut de l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: {
        status: 'UNDER_REVIEW',
        validationComment: notes || null,
        reviewedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        status: true,
        validationComment: true,
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
        }
      }
    })

    // Créer une notification pour le PDG
    await prisma.notification.create({
      data: {
        userId: 'pdg-user-id', // TODO: Récupérer l'ID du PDG
        title: 'Nouvelle œuvre à valider',
        message: `L'œuvre "${work.title}" de ${work.author.name} a été transmise par le représentant pour validation.`,
        type: 'WORK_REVIEW',
        isRead: false,
        metadata: {
          workId: work.id,
          authorId: work.author.id,
          representativeId: session.user.id
        }
      }
    })

    // Créer une notification pour l'auteur
    await prisma.notification.create({
      data: {
        userId: work.author.id,
        title: 'Œuvre transmise au PDG',
        message: `Votre œuvre "${work.title}" a été transmise au PDG pour validation finale.`,
        type: 'WORK_STATUS',
        isRead: false,
        metadata: {
          workId: work.id,
          status: 'UNDER_REVIEW'
        }
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRANSMIT_WORK',
        details: `Œuvre transmise au PDG: ${work.title} (Auteur: ${work.author.name})`,
        metadata: {
          workId: work.id,
          workTitle: work.title,
          authorId: work.author.id,
          authorName: work.author.name,
          notes: notes || null
        }
      }
    })

    return NextResponse.json({
      message: 'Œuvre transmise au PDG avec succès',
      work: updatedWork
    })

  } catch (error: any) {
    console.error('Erreur lors de la transmission de l\'œuvre:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
