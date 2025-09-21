import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, ProjectStatus } from "@prisma/client"

// GET - Récupérer les projets du concepteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - Concepteur role required" }, { status: 403 })
    }

    console.log("📋 Fetching concepteur projects for:", user.name)

    const userId = user.id

    // Récupérer les projets du concepteur
    const projects = await prisma.project.findMany({
      where: { concepteurId: userId },
      include: {
        discipline: true,
        reviewer: {
          select: { id: true, name: true, email: true }
        },
        work: {
          select: { id: true, title: true, isbn: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    console.log("📋 Found projects:", projects.length)

    // Calculer les statistiques
    const stats = {
      total: projects.length,
      draft: projects.filter(p => p.status === ProjectStatus.DRAFT).length,
      submitted: projects.filter(p => p.status === ProjectStatus.SUBMITTED).length,
      underReview: projects.filter(p => p.status === ProjectStatus.UNDER_REVIEW).length,
      accepted: projects.filter(p => p.status === ProjectStatus.ACCEPTED).length,
      rejected: projects.filter(p => p.status === ProjectStatus.REJECTED).length
    }

    console.log(`📋 Concepteur projects data: ${stats.total} projects`)

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
    console.error("❌ Error fetching concepteur projects:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: "Erreur lors de la récupération des projets. Veuillez vérifier la configuration de la base de données."
    }, { status: 500 })
  }
}

// POST - Créer un nouveau projet (concepteur uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - Concepteur role required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, disciplineId } = body

    // Validation des données
    if (!title || !disciplineId) {
      return NextResponse.json({ 
        error: "Missing required fields: title, disciplineId" 
      }, { status: 400 })
    }

    console.log("📋 Creating new project:", title)

    // Vérifier que la discipline existe
    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    })

    if (!discipline) {
      return NextResponse.json({ error: "Discipline not found" }, { status: 404 })
    }

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        disciplineId,
        concepteurId: user.id,
        status: ProjectStatus.DRAFT // Toujours commencer en brouillon
      },
      include: {
        discipline: true
      }
    })

    console.log("✅ Project created:", project.title)

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        discipline: project.discipline.name,
        createdAt: project.createdAt
      },
      message: "Projet créé avec succès"
    })

  } catch (error) {
    console.error("❌ Error creating project:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: "Erreur lors de la création du projet. Veuillez vérifier la configuration de la base de données."
    }, { status: 500 })
  }
}

// PUT - Mettre à jour un projet (concepteur uniquement)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - Concepteur role required" }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, title, description, status } = body

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    console.log("📋 Updating project:", projectId)

    // Vérifier que le projet appartient au concepteur
    const existingProject = await prisma.project.findFirst({
      where: { 
        id: projectId, 
        concepteurId: user.id 
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status && Object.values(ProjectStatus).includes(status)) {
      updateData.status = status
      if (status === ProjectStatus.SUBMITTED) {
        updateData.submittedAt = new Date()
      }
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        discipline: true
      }
    })

    console.log("✅ Project updated:", updatedProject.title)

    return NextResponse.json({
      project: {
        id: updatedProject.id,
        title: updatedProject.title,
        description: updatedProject.description,
        status: updatedProject.status,
        discipline: updatedProject.discipline.name,
        updatedAt: updatedProject.updatedAt
      },
      message: "Projet mis à jour avec succès"
    })

  } catch (error) {
    console.error("❌ Error updating project:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
