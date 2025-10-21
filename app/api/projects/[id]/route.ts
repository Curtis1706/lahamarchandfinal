import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/projects/[id] - Récupérer un projet spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      );
    }

    // Récupérer le projet avec toutes ses relations
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
        },
        works: {
          include: {
            discipline: {
              select: {
                id: true,
                name: true
              }
            },
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            conceptor: {
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
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const userRole = session.user.role;
    const userId = session.user.id;

    // Seuls le concepteur du projet et le PDG peuvent voir les détails
    if (userRole !== "PDG" && project.concepteurId !== userId) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce projet" },
        { status: 403 }
      );
    }

    console.log(`✅ Projet ${projectId} récupéré par ${session.user.name} (${userRole})`);

    return NextResponse.json(project, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Modifier un projet spécifique
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const data = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        concepteur: true
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // Vérifier les permissions selon le rôle et l'action
    if (data.status) {
      // Changement de statut - seul le PDG peut le faire
      if (userRole !== "PDG") {
        return NextResponse.json(
          { error: "Seul le PDG peut changer le statut d'un projet" },
          { status: 403 }
        );
      }
    } else {
      // Modification du contenu - seul le concepteur peut le faire (et seulement si DRAFT)
      if (existingProject.concepteurId !== userId) {
        return NextResponse.json(
          { error: "Seul le concepteur peut modifier ce projet" },
          { status: 403 }
        );
      }
      
      if (existingProject.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Ce projet ne peut plus être modifié car il a été soumis" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.objectives) updateData.objectives = data.objectives;
    if (data.expectedDeliverables) updateData.expectedDeliverables = data.expectedDeliverables;
    if (data.requiredResources) updateData.requiredResources = data.requiredResources;
    if (data.timeline) updateData.timeline = data.timeline;
    if (data.disciplineId) updateData.disciplineId = data.disciplineId;

    // Gestion des changements de statut
    if (data.status) {
      updateData.status = data.status;
      updateData.reviewerId = userId;
      updateData.reviewedAt = new Date();

      if (data.status === "SUBMITTED") {
        updateData.submittedAt = new Date();
      }

      if (data.status === "REJECTED" && data.rejectionReason) {
        updateData.rejectionReason = data.rejectionReason;
      }
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
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
        },
        works: {
          include: {
            discipline: true
          }
        }
      }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: data.status ? `PROJECT_STATUS_CHANGED_${data.status}` : "PROJECT_UPDATED",
        performedBy: session.user.name || "Utilisateur",
        details: data.status 
          ? `Projet "${updatedProject.title}" - statut changé vers ${data.status}`
          : `Projet "${updatedProject.title}" modifié`,
        userId: userId
      }
    });

    // Créer une notification pour le concepteur si changement de statut
    if (data.status && existingProject.status !== data.status) {
      let notificationTitle = "";
      let notificationMessage = "";
      let notificationType = "";

      switch (data.status) {
        case "ACCEPTED":
          notificationTitle = "Projet accepté";
          notificationMessage = `Votre projet "${updatedProject.title}" a été accepté par l'administration. Vous pouvez maintenant créer des œuvres pour ce projet.`;
          notificationType = "PROJECT_ACCEPTED";
          break;
        case "REJECTED":
          notificationTitle = "Projet refusé";
          notificationMessage = `Votre projet "${updatedProject.title}" a été refusé. ${data.rejectionReason ? `Motif: ${data.rejectionReason}` : ''}`;
          notificationType = "PROJECT_REJECTED";
          break;
        case "UNDER_REVIEW":
          notificationTitle = "Projet en cours de révision";
          notificationMessage = `Votre projet "${updatedProject.title}" est maintenant en cours de révision par l'administration.`;
          notificationType = "PROJECT_UNDER_REVIEW";
          break;
      }

      if (notificationTitle) {
        await prisma.notification.create({
          data: {
            userId: updatedProject.concepteurId,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            data: JSON.stringify({
              projectId: updatedProject.id,
              projectTitle: updatedProject.title,
              newStatus: data.status,
              rejectionReason: data.rejectionReason || null
            })
          }
        });
      }
    }

    console.log(`✅ Projet ${projectId} mis à jour par ${session.user.name} (${userRole})`);

    return NextResponse.json(updatedProject, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Supprimer un projet spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      );
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

    // Vérifier s'il y a des œuvres associées (avec gestion d'erreur si relation pas encore migrée)
    let associatedWorks = [];
    try {
      associatedWorks = await prisma.work.findMany({
        where: { projectId: projectId }
      });
    } catch (worksError) {
      console.log("⚠️ Relation works pas encore migrée, continuation sans vérification œuvres");
    }

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // Seul le concepteur peut supprimer son projet (et seulement si DRAFT)
    if (existingProject.concepteurId !== userId) {
      return NextResponse.json(
        { error: "Seul le concepteur peut supprimer ce projet" },
        { status: 403 }
      );
    }

    if (existingProject.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Ce projet ne peut pas être supprimé car il a été soumis" },
        { status: 400 }
      );
    }

    if (associatedWorks.length > 0) {
      return NextResponse.json(
        { error: "Ce projet ne peut pas être supprimé car il a des œuvres associées" },
        { status: 400 }
      );
    }

    // Supprimer le projet
    await prisma.project.delete({
      where: { id: projectId }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "PROJECT_DELETED",
        performedBy: session.user.name || "Utilisateur",
        details: `Projet "${existingProject.title}" supprimé`,
        userId: userId
      }
    });

    console.log(`✅ Projet ${projectId} supprimé par ${session.user.name} (${userRole})`);

    return NextResponse.json(
      { message: "Projet supprimé avec succès" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression du projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet: " + error.message },
      { status: 500 }
    );
  }
}
