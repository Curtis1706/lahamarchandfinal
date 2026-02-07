import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    logger.debug("🔍 API POST /concepteurs/projects - Création de projet par Concepteur");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    logger.debug("🔍 Body reçu:", body);

    const {
      title,
      disciplineId,
      concepteurId,
      description,
      objectives,
      expectedDeliverables,
      requiredResources,
      timeline,
      status = "DRAFT"
    } = body;

    logger.debug("🔍 Données extraites:", {
      title,
      disciplineId,
      concepteurId,
      description,
      objectives,
      expectedDeliverables,
      requiredResources,
      timeline,
      status
    });

    // Validation des champs obligatoires
    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre du projet est obligatoire" }, { status: 400 });
    }

    if (!disciplineId) {
      return NextResponse.json({ error: "La discipline est obligatoire" }, { status: 400 });
    }

    if (!concepteurId) {
      return NextResponse.json({ error: "L'ID du concepteur est obligatoire" }, { status: 400 });
    }

    // Vérifier que l'utilisateur connecté est bien le concepteur ou un admin
    if (session.user.id !== concepteurId && session.user.role !== "PDG") {
      return NextResponse.json({ error: "Vous ne pouvez créer un projet que pour vous-même" }, { status: 403 });
    }

    // Vérifier que la discipline existe
    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    });

    if (!discipline) {
      return NextResponse.json({ error: "Discipline non trouvée" }, { status: 404 });
    }

    // Vérifier que le concepteur existe
    const concepteur = await prisma.user.findUnique({
      where: { id: concepteurId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!concepteur) {
      return NextResponse.json({ error: "Concepteur non trouvé" }, { status: 404 });
    }

    if (concepteur.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Seul un utilisateur avec le rôle CONCEPTEUR peut créer des projets" }, { status: 403 });
    }

    // Créer le projet
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        objectives: objectives?.trim() || null,
        expectedDeliverables: expectedDeliverables?.trim() || null,
        requiredResources: requiredResources?.trim() || null,
        timeline: timeline?.trim() || null,
        status: status,
        discipline: {
          connect: { id: disciplineId }
        },
        concepteur: {
          connect: { id: concepteurId }
        }
      },
      include: {
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.debug("✅ Projet créé avec succès:", {
      id: project.id,
      title: project.title,
      status: project.status,
      concepteur: project.concepteur?.name || "Non défini",
      discipline: project.discipline?.name || "Non défini"
    });

    return NextResponse.json(project, { status: 201 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const concepteurId = searchParams.get('concepteurId');
    const status = searchParams.get('status');

    // Construire les conditions de filtre
    let whereClause: any = {};

    if (concepteurId) {
      whereClause.concepteurId = concepteurId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Si l'utilisateur n'est pas PDG, il ne peut voir que ses propres projets
    // Pour un concepteur, on utilise toujours son propre ID
    if (session.user.role === "CONCEPTEUR") {
      whereClause.concepteurId = session.user.id;
    } else if (session.user.role !== "PDG") {
      whereClause.concepteurId = session.user.id;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.debug(`🔍 ${projects.length} projet(s) trouvé(s) pour concepteurId: ${concepteurId}`);

    return NextResponse.json({ projects }, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, status, ...updateData } = body;

    if (!projectId) {
      return NextResponse.json({ error: "ID du projet requis" }, { status: 400 });
    }

    // Vérifier que le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        concepteur: {
          select: { id: true, name: true }
        }
      }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier les permissions (ownership)
    if (session.user.id !== existingProject.concepteurId && session.user.role !== "PDG") {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres projets" }, { status: 403 });
    }

    // Si c'est un concepteur, vérifier qu'il peut modifier/soumettre ce projet
    if (session.user.role === "CONCEPTEUR" && session.user.id === existingProject.concepteurId) {
      const { canEditProject, canSubmitProject, canArchiveProject } = await import("@/lib/project-status");

      // Si c'est une soumission
      if (status === "SUBMITTED") {
        if (!canSubmitProject(existingProject.status)) {
          return NextResponse.json(
            { error: "Ce projet ne peut pas être soumis dans son état actuel" },
            { status: 400 }
          );
        }
        updateData.submittedAt = new Date();
      }
      // Si c'est un archivage
      else if (status === "ARCHIVED") {
        if (!canArchiveProject(existingProject.status)) {
          return NextResponse.json(
            { error: "Ce projet ne peut pas être archivé dans son état actuel" },
            { status: 400 }
          );
        }
      }
      // Si c'est une modification de contenu (sans changement de statut)
      else if (!status && (updateData.title || updateData.description !== undefined)) {
        if (!canEditProject(existingProject.status)) {
          return NextResponse.json(
            { error: "Ce projet ne peut plus être modifié" },
            { status: 400 }
          );
        }
      }
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...updateData,
        status: status || existingProject.status,
      },
      include: {
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Créer audit log pour soumission
    if (status === "SUBMITTED" && existingProject.status !== "SUBMITTED") {
      try {
        // Créer une notification pour les PDG
        const pdgUsers = await prisma.user.findMany({
          where: { role: "PDG", status: "ACTIVE" },
          select: { id: true }
        });

        for (const pdg of pdgUsers) {
          await prisma.notification.create({
            data: {
              userId: pdg.id,
              title: "Nouveau projet soumis pour validation",
              message: `Le concepteur ${updatedProject.concepteur.name} a soumis le projet "${updatedProject.title}" pour validation.`,
              type: "PROJECT_SUBMITTED",
              data: JSON.stringify({
                projectId: updatedProject.id,
                projectTitle: updatedProject.title,
                concepteurId: updatedProject.concepteurId,
                concepteurName: updatedProject.concepteur.name,
                discipline: updatedProject.discipline.name
              })
            }
          });
        }

        logger.debug("✅ Notifications créées pour les PDG");
      } catch (auditError) {
        logger.error("⚠️ Erreur création audit/notifications:", auditError);
      }
    }

    return NextResponse.json(updatedProject, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la mise à jour du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet: " + error.message },
      { status: 500 }
    );
  }
}
