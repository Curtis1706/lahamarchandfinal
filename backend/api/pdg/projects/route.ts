import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, ProjectStatus, WorkStatus } from "@prisma/client"

// GET - Récupérer tous les projets soumis (PDG uniquement)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching all submitted projects for PDG:", user.name)

    // Récupérer tous les projets soumis ou en révision
    const projects = await prisma.project.findMany({
      where: { 
        status: {
          in: [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW]
        }
      },
      include: {
        discipline: true,
        concepteur: {
          select: { id: true, name: true, email: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        },
        work: {
          select: { id: true, title: true, isbn: true, status: true }
        }
      },
      orderBy: { submittedAt: "desc" }
    })

    console.log("👑 Found submitted projects:", projects.length)

    // Calculer les statistiques
    const stats = {
      total: projects.length,
      submitted: projects.filter(p => p.status === ProjectStatus.SUBMITTED).length,
      underReview: projects.filter(p => p.status === ProjectStatus.UNDER_REVIEW).length,
      pendingReview: projects.filter(p => !p.reviewerId).length
    }

    console.log(`👑 PDG projects data: ${stats.total} projects`)

    return NextResponse.json({
      projects,
      stats,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG projects:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Valider ou refuser un projet (PDG uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, action, workData } = body // action: "accept" | "reject"

    if (!projectId || !action) {
      return NextResponse.json({ 
        error: "Missing required fields: projectId, action" 
      }, { status: 400 })
    }

    console.log(`👑 PDG ${action}ing project:`, projectId)

    // Vérifier que le projet existe et est en attente de validation
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        status: {
          in: [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW]
        }
      },
      include: {
        discipline: true,
        concepteur: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found or not ready for review" }, { status: 404 })
    }

    if (action === "accept") {
      // Validation des données pour créer l'œuvre
      if (!workData || !workData.isbn || workData.price <= 0) {
        return NextResponse.json({ 
          error: "Missing work data: isbn and price > 0 required for acceptance" 
        }, { status: 400 })
      }

      // Créer l'œuvre à partir du projet validé
      const work = await prisma.work.create({
        data: {
          title: project.title, // Utiliser le titre du projet
          isbn: workData.isbn,
          price: parseFloat(workData.price.toString()),
          tva: workData.tva || 0.18,
          stock: workData.stock || 0,
          disciplineId: project.disciplineId,
          authorId: project.concepteurId, // Le concepteur devient l'auteur
          concepteurId: project.concepteurId,
          status: WorkStatus.ON_SALE, // Mettre directement en vente pour être visible dans le catalogue
          publishedAt: new Date()
        }
      })

      // Mettre à jour le projet comme accepté et lier à l'œuvre
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.ACCEPTED,
          reviewedAt: new Date(),
          reviewerId: user.id,
          workId: work.id
        },
        include: {
          discipline: true,
          concepteur: true,
          work: true
        }
      })

      // TODO: Créer une notification pour le concepteur quand le modèle Notification sera disponible
      console.log(`📢 Notification à créer: Projet "${project.title}" approuvé pour ${project.concepteur.name}`)

      console.log("✅ Project accepted and work created:", work.title)

      return NextResponse.json({
        project: updatedProject,
        work: {
          id: work.id,
          title: work.title,
          isbn: work.isbn,
          price: work.price,
          status: work.status
        },
        message: "Projet accepté et œuvre créée avec succès"
      })

    } else if (action === "reject") {
      // Refuser le projet
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.REJECTED,
          reviewedAt: new Date(),
          reviewerId: user.id
        },
        include: {
          discipline: true,
          concepteur: true
        }
      })

      // TODO: Créer une notification pour le concepteur quand le modèle Notification sera disponible
      console.log(`📢 Notification à créer: Projet "${project.title}" refusé pour ${project.concepteur.name}`)

      console.log("❌ Project rejected:", project.title)

      return NextResponse.json({
        project: updatedProject,
        message: "Projet refusé"
      })

    } else {
      return NextResponse.json({ error: "Invalid action. Use 'accept' or 'reject'" }, { status: 400 })
    }

  } catch (error) {
    console.error("❌ Error processing project:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
