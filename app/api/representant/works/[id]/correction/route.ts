import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// PUT /api/representant/works/[id]/correction - Demander une correction à l'auteur
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

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { error: 'Les notes de correction sont obligatoires' },
        { status: 400 }
      )
    }

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
        { error: 'Cette œuvre ne peut pas être renvoyée pour correction' },
        { status: 400 }
      )
    }

    // Mettre à jour l'œuvre avec les notes de correction
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: {
        validationComment: notes,
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
        }
      }
    })

    // Créer une notification pour l'auteur
    await prisma.notification.create({
      data: {
        userId: work.author.id,
        title: 'Corrections demandées',
        message: `Des corrections ont été demandées pour votre œuvre "${work.title}". Veuillez consulter les détails.`,
        type: 'WORK_CORRECTION',
        isRead: false,
        metadata: {
          workId: work.id,
          workTitle: work.title,
          correctionNotes: notes
        }
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REQUEST_CORRECTION',
        details: `Corrections demandées pour l'œuvre: ${work.title} (Auteur: ${work.author.name})`,
        metadata: {
          workId: work.id,
          workTitle: work.title,
          authorId: work.author.id,
          authorName: work.author.name,
          correctionNotes: notes
        }
      }
    })

    return NextResponse.json({
      message: 'Demande de correction envoyée à l\'auteur',
      work: updatedWork
    })

  } catch (error: any) {
    console.error('Erreur lors de la demande de correction:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
