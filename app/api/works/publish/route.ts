import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/works/publish - Publier un livre (PDG uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé. Seul le PDG peut publier un livre." }, { status: 403 })
    }

    const { workId, action, authorId, rejectionReason } = await request.json() // action: "validate", "publish" ou "reject"

    if (!workId || !action) {
      return NextResponse.json({ error: "ID du livre et action requis" }, { status: 400 })
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
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
      return NextResponse.json({ error: "Livre introuvable" }, { status: 404 })
    }

    // Validation : PENDING → VALIDATED
    if (action === "validate") {
      if (work.status !== "PENDING") {
        return NextResponse.json({ error: "Seules les œuvres en attente peuvent être validées" }, { status: 400 })
      }

      let updateData: any = {
        status: "VALIDATED",
        reviewedAt: new Date(),
        reviewerId: session.user.id,
        stock: 0, // Le stock par défaut d'une œuvre validée est 0
        physicalStock: 0
      }

      // Si un authorId est fourni, changer l'auteur du livre
      if (authorId) {
        const newAuthor = await prisma.user.findUnique({
          where: { id: authorId },
          select: { id: true, name: true, email: true, role: true }
        })

        if (!newAuthor) {
          return NextResponse.json({ error: "Auteur introuvable" }, { status: 404 })
        }

        if (newAuthor.role !== "AUTEUR") {
          return NextResponse.json({ error: "L'utilisateur sélectionné n'est pas un auteur" }, { status: 400 })
        }

        updateData.authorId = authorId
      }

      const updatedWork = await prisma.work.update({
        where: { id: workId },
        data: updateData,
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

      // Notification à l'auteur
      const finalAuthorId = authorId || work.authorId
      try {
        await prisma.notification.create({
          data: {
            userId: finalAuthorId,
            type: "WORK_VALIDATED",
            title: "Œuvre validée",
            message: authorId 
              ? `Le livre "${work.title}" vous a été attribué et a été validé. Il peut maintenant être publié.`
              : `Votre livre "${work.title}" a été validé. Il peut maintenant être publié.`,
            data: JSON.stringify({
              workId: workId,
              workTitle: work.title
            }),
            read: false
          }
        })
      } catch (notifError) {
        logger.error("Erreur lors de la création de la notification:", notifError)
      }

      return NextResponse.json({
        success: true,
        message: "Œuvre validée avec succès",
        work: updatedWork
      }, { status: 200 })

    // Publication : VALIDATED → PUBLISHED
    } else if (action === "publish") {
      if (work.status !== "VALIDATED") {
        return NextResponse.json({ error: "Seules les œuvres validées peuvent être publiées" }, { status: 400 })
      }
      let updateData: any = {
        status: "PUBLISHED",
        publishedAt: new Date()
      }

      // Publier le livre
      const updatedWork = await prisma.work.update({
        where: { id: workId },
        data: updateData,
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

      // Créer une notification pour l'auteur (utiliser le nouvel auteur si changé)
      const finalAuthorId = authorId || work.authorId
      try {
        await prisma.notification.create({
          data: {
            userId: finalAuthorId,
            type: "WORK_APPROVED",
            title: "Livre publié",
            message: authorId 
              ? `Le livre "${work.title}" vous a été attribué et a été publié avec succès. Il est maintenant visible dans le catalogue.`
              : `Votre livre "${work.title}" a été publié avec succès. Il est maintenant visible dans le catalogue.`,
            data: JSON.stringify({
              workId: workId,
              workTitle: work.title
            }),
            read: false
          }
        })
      } catch (notifError) {
        logger.error("Erreur lors de la création de la notification:", notifError)
      }

      return NextResponse.json({
        success: true,
        message: "Livre publié avec succès",
        work: updatedWork
      }, { status: 200 })

    // Refus : PENDING → REJECTED
    } else if (action === "reject") {
      if (work.status !== "PENDING") {
        return NextResponse.json({ error: "Seules les œuvres en attente peuvent être refusées" }, { status: 400 })
      }

      // Refuser le livre
      const updatedWork = await prisma.work.update({
        where: { id: workId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Raison non spécifiée",
          reviewedAt: new Date(),
          reviewerId: session.user.id
        },
        include: {
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
      try {
        await prisma.notification.create({
          data: {
            userId: work.authorId,
            type: "WORK_REJECTED",
            title: "Livre refusé",
            message: `Votre livre "${work.title}" a été refusé.${rejectionReason ? ` Raison: ${rejectionReason}` : ''}`,
            data: JSON.stringify({
              workId: workId,
              workTitle: work.title,
              rejectionReason: rejectionReason || "Raison non spécifiée"
            }),
            read: false
          }
        })
      } catch (notifError) {
        logger.error("Erreur lors de la création de la notification:", notifError)
      }

      return NextResponse.json({
        success: true,
        message: "Livre refusé",
        work: updatedWork
      }, { status: 200 })

    } else {
      return NextResponse.json({ error: "Action invalide. Utilisez 'validate', 'publish' ou 'reject'" }, { status: 400 })
    }

  } catch (error: any) {
    logger.error("Error publishing/rejecting work:", error)
    return NextResponse.json({ 
      error: error.message || "Erreur lors de la publication/refus du livre" 
    }, { status: 500 })
  }
}

