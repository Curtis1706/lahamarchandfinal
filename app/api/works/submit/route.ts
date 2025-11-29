import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/works/submit - Soumettre un livre pour publication (Auteur)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { workId } = await request.json()

    if (!workId) {
      return NextResponse.json({ error: "ID du livre requis" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est l'auteur du livre
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { authorId: true, status: true, title: true }
    })

    if (!work) {
      return NextResponse.json({ error: "Livre introuvable" }, { status: 404 })
    }

    if (work.authorId !== session.user.id) {
      return NextResponse.json({ error: "Vous n'êtes pas l'auteur de ce livre" }, { status: 403 })
    }

    if (work.status === "PUBLISHED") {
      return NextResponse.json({ error: "Ce livre est déjà publié" }, { status: 400 })
    }

    if (work.status === "PENDING") {
      return NextResponse.json({ error: "Ce livre est déjà en attente de validation" }, { status: 400 })
    }

    // Mettre à jour le statut à PENDING
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: {
        status: "PENDING",
        submittedAt: new Date()
      },
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
        }
      }
    })

    // Créer une notification pour le PDG
    try {
      const pdg = await prisma.user.findFirst({
        where: { role: "PDG" },
        select: { id: true }
      })

      if (pdg) {
        await prisma.notification.create({
          data: {
            userId: pdg.id,
            type: "WORK_SUBMITTED",
            title: "Nouveau livre soumis pour publication",
            message: `L'auteur ${updatedWork.author.name} a soumis le livre "${updatedWork.title}" pour publication.`,
            data: JSON.stringify({
              workId: workId,
              authorId: session.user.id,
              authorName: updatedWork.author.name
            }),
            read: false
          }
        })
      }
    } catch (notifError) {
      console.error("Erreur lors de la création de la notification:", notifError)
      // Ne pas faire échouer la soumission si la notification échoue
    }

    return NextResponse.json({
      success: true,
      message: "Livre soumis pour publication avec succès",
      work: updatedWork
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error submitting work:", error)
    return NextResponse.json({ 
      error: error.message || "Erreur lors de la soumission du livre" 
    }, { status: 500 })
  }
}

