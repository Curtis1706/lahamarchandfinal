import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects - Récupérer tous les projets
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const concepteurId = searchParams.get('concepteurId');
    const includeWorks = searchParams.get('includeWorks') === 'true';
    const status = searchParams.get('status');

    // Construire l'include de base
    const baseInclude: any = {
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
    };

    // Ajouter works si demandé et disponible
    if (includeWorks) {
      try {
        // Test si la relation works existe
        await prisma.project.findFirst({
          include: { works: true }
        });
        baseInclude.works = {
          include: {
            orderItems: true,
            royalties: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        };
      } catch (worksError) {
        logger.debug("⚠️ Relation works non disponible, continuation sans works");
      }
    }

    // Construire la clause where
    let whereClause: any = {};
    if (concepteurId) {
      whereClause.concepteurId = concepteurId;
    }

    // Filtrer par statut si demandé
    if (status) {
      whereClause.status = status;
    }

    // Log pour debug
    logger.debug("🔍 API Projects - Utilisateur:", session.user.email, "Rôle:", session.user.role);
    logger.debug("🔍 API Projects - Paramètres:", { concepteurId, status, includeWorks });
    logger.debug("🔍 API Projects - Clause where:", whereClause);

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: baseInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.debug("🔍 API Projects - Résultat:", projects.length, "projets trouvés");
    if (projects.length > 0) {
      projects.forEach((project, index) => {
        const concepteurName = project.concepteur && 'name' in project.concepteur ? project.concepteur.name : 'Non défini';
        logger.debug(`   ${index + 1}. "${project.title}" (${project.status}) - ${concepteurName}`);
      });
    }

    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    logger.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  logger.debug("🔍 API POST /projects - Début de la requête");

  try {
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

    logger.debug("🔍 Données extraites:", { title, disciplineId, concepteurId, description, status });

    // Validation des champs obligatoires
    // Pour le PDG, le concepteur est optionnel (on l'assigne à lui-même par défaut s'il n'est pas spécifié)
    if (!title || !disciplineId) {
      return NextResponse.json(
        { error: "Le titre et la discipline sont obligatoires" },
        { status: 400 }
      );
    }

    if (session.user.role !== "PDG" && !concepteurId) {
      return NextResponse.json(
        { error: "Le concepteur est obligatoire" },
        { status: 400 }
      );
    }

    // Déterminer l'ID du concepteur final
    let finalConcepteurId = concepteurId;

    // Si pas de concepteur spécifié et que c'est un PDG, on l'assigne à lui-même
    if (!finalConcepteurId && session.user.role === "PDG") {
      finalConcepteurId = session.user.id;
    }

    // Vérifier que l'utilisateur est un concepteur ou un PDG
    // Si c'est un concepteur, vérifier que concepteurId correspond à l'utilisateur connecté
    if (session.user.role !== "PDG" && session.user.id !== finalConcepteurId) {
      return NextResponse.json(
        { error: "Vous ne pouvez créer un projet que pour vous-même" },
        { status: 403 }
      );
    }

    // Vérifier que le concepteur existe
    const concepteur = await prisma.user.findUnique({
      where: { id: finalConcepteurId }
    });

    if (!concepteur) {
      return NextResponse.json(
        { error: "Concepteur non trouvé" },
        { status: 404 }
      );
    }

    // Si c'est un PDG qui s'assigne, on ne vérifie pas le rôle CONCEPTEUR
    if (concepteur.role !== "CONCEPTEUR" && session.user.role !== "PDG") {
      return NextResponse.json(
        { error: "L'utilisateur sélectionné n'est pas un concepteur" },
        { status: 400 }
      );
    }

    // Trouver la discipline par nom ou ID
    let discipline;
    if (disciplineId.match(/^[a-zA-Z0-9_-]+$/)) {
      // Si c'est un ID (format alphanumérique)
      discipline = await prisma.discipline.findUnique({
        where: { id: disciplineId }
      });
    } else {
      // Si c'est un nom de discipline
      discipline = await prisma.discipline.findFirst({
        where: { name: disciplineId }
      });
    }

    if (!discipline) {
      return NextResponse.json(
        { error: "Discipline non trouvée" },
        { status: 400 }
      );
    }

    // Validation du statut
    const validStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    logger.debug("🔍 Tentative de création avec Prisma...");

    // Créer le projet dans le modèle Project
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        objectives: objectives?.trim() || null,
        expectedDeliverables: expectedDeliverables?.trim() || null,
        requiredResources: requiredResources?.trim() || null,
        timeline: timeline?.trim() || null,
        discipline: {
          connect: { id: discipline.id }
        },
        concepteur: {
          connect: { id: finalConcepteurId }
        },
        status: status,
        submittedAt: status === "SUBMITTED" ? new Date() : null
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

    logger.debug("✅ Projet créé, ajout des logs et notifications...");

    // Si le statut est SUBMITTED, créer automatiquement une œuvre en attente de validation
    if (status === "SUBMITTED") {
      try {
        // Générer un ISBN unique pour l'œuvre
        const isbn = `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const work = await prisma.work.create({
          data: {
            title: project.title,
            isbn: isbn,
            price: 0, // Prix par défaut, à définir lors de la validation
            stock: 0, // Stock par défaut
            minStock: 10,
            maxStock: null,
            status: "PENDING", // En attente de validation par le PDG
            author: {
              connect: { id: finalConcepteurId }
            },
            discipline: {
              connect: { id: discipline.id }
            },
            concepteur: {
              connect: { id: finalConcepteurId }
            },
            project: {
              connect: { id: project.id }
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

        logger.debug("✅ Œuvre créée automatiquement:", work);

        // Créer une notification pour le PDG
        try {
          const pdgUser = await prisma.user.findFirst({
            where: { role: "PDG" }
          });

          if (pdgUser) {
            await prisma.notification.create({
              data: {
                userId: pdgUser.id,
                title: "Nouvelle œuvre soumise",
                message: `Le concepteur ${project.concepteur.name} a soumis une nouvelle œuvre "${work.title}" pour validation.`,
                type: "WORK_SUBMITTED_FOR_VALIDATION",
                data: JSON.stringify({
                  workId: work.id,
                  workTitle: work.title,
                  concepteurId: finalConcepteurId,
                  concepteurName: project.concepteur.name,
                  discipline: discipline.name,
                  isbn: work.isbn
                })
              }
            });
            logger.debug("✅ Notification créée pour le PDG");
          }
        } catch (notificationError) {
          logger.error("⚠️ Erreur création notification PDG:", notificationError);
        }

        // Créer une notification pour le concepteur
        try {
          await prisma.notification.create({
            data: {
              userId: finalConcepteurId,
              title: "Projet soumis avec succès",
              message: `Votre projet "${project.title}" a été soumis pour validation et sera examiné par l'équipe éditoriale.`,
              type: "PROJECT_SUBMITTED",
              data: JSON.stringify({
                projectId: project.id,
                workId: work.id,
                projectTitle: project.title,
                status: "SUBMITTED"
              })
            }
          });
          logger.debug("✅ Notification créée pour le concepteur");
        } catch (notificationError) {
          logger.error("⚠️ Erreur création notification concepteur:", notificationError);
        }

      } catch (workError) {
        logger.error("⚠️ Erreur création œuvre automatique:", workError);
        // Ne pas faire échouer la création du projet pour une erreur d'œuvre
      }
    }

    // Créer une notification pour le concepteur (pour tous les statuts)
    try {
      let notificationTitle, notificationMessage, notificationType;

      if (status === "DRAFT") {
        notificationTitle = "Projet créé en brouillon";
        notificationMessage = `Votre projet "${project.title}" a été sauvegardé en brouillon.`;
        notificationType = "PROJECT_DRAFT_CREATED";
      } else if (status === "SUBMITTED") {
        notificationTitle = "Projet soumis pour validation";
        notificationMessage = `Votre projet "${project.title}" a été soumis pour validation et sera examiné par l'équipe éditoriale.`;
        notificationType = "PROJECT_SUBMITTED";
      } else {
        notificationTitle = "Projet créé";
        notificationMessage = `Votre projet "${project.title}" a été créé avec succès.`;
        notificationType = "PROJECT_CREATED";
      }

      await prisma.notification.create({
        data: {
          userId: finalConcepteurId,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          data: JSON.stringify({
            projectId: project.id,
            projectTitle: project.title,
            status: status
          })
        }
      });
      logger.debug("✅ Notification créée");
    } catch (notificationError) {
      logger.error("⚠️ Erreur création notification:", notificationError);
    }

    logger.debug("✅ Projet créé avec succès:", project);

    return NextResponse.json(project, { status: 201 });

  } catch (error: any) {
    logger.error("❌ Erreur création projet:", error);
    logger.error("❌ Stack:", error.stack);

    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un projet avec cet ISBN existe déjà" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du projet: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Mettre à jour un projet (soumission pour validation)
export async function PUT(request: NextRequest) {
  logger.debug("🔍 API PUT /projects - Mise à jour de projet");

  try {
    const body = await request.json();
    const { id, status, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id },
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

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier ownership (sauf pour PDG)
    const session = await getServerSession(authOptions);
    if (session?.user && session.user.role !== "PDG") {
      if (session.user.id !== existingProject.concepteurId) {
        return NextResponse.json(
          { error: "Vous ne pouvez modifier que vos propres projets" },
          { status: 403 }
        );
      }
    }

    // Mettre à jour le projet
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        status: status || existingProject.status,
        updatedAt: new Date()
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

    // Si le statut est changé en ACCEPTED, déclencher le workflow complet de validation
    if (status === "ACCEPTED" && existingProject.status !== "ACCEPTED" && session?.user) {
      try {
        // 1. Enregistrer la date de validation et le validateur pour traçabilité
        await prisma.project.update({
          where: { id },
          data: {
            reviewerId: session.user.id,
            reviewedAt: new Date()
          }
        });

        // 2. Créer une notification détaillée pour le concepteur
        await prisma.notification.create({
          data: {
            userId: updatedProject.concepteurId,
            title: "🎉 Projet validé par l'administration",
            message: `Félicitations ! Votre projet "${updatedProject.title}" a été validé par l'administration.\n\n✅ Vous pouvez désormais :\n• Créer et publier des œuvres rattachées à ce projet\n• Accéder aux fonctionnalités avancées de création\n• Suivre la progression de vos œuvres\n\nRendez-vous dans votre espace concepteur pour commencer !`,
            type: "PROJECT_ACCEPTED",
            data: JSON.stringify({
              projectId: updatedProject.id,
              projectTitle: updatedProject.title,
              discipline: updatedProject.discipline.name,
              validatedBy: session.user.name,
              validatedAt: new Date().toISOString()
            })
          }
        });

        logger.debug(`✅ Projet "${updatedProject.title}" validé - Workflow complet déclenché:`);
        logger.debug(`   • Concepteur: ${updatedProject.concepteur.name}`);
        logger.debug(`   • Discipline: ${updatedProject.discipline.name}`);
        logger.debug(`   • Validé par: ${session.user.name}`);
        logger.debug(`   • Fonctionnalités œuvres débloquées`);

      } catch (workflowError) {
        logger.error("❌ Erreur lors du workflow de validation:", workflowError);
        // On continue même si une partie du workflow échoue pour ne pas bloquer la validation
      }
    }

    // Gestion des notifications pour les autres changements de statut
    if (status === "REJECTED" && existingProject.status !== "REJECTED") {
      try {
        await prisma.notification.create({
          data: {
            userId: updatedProject.concepteurId,
            title: "Projet refusé",
            message: `Votre projet "${updatedProject.title}" a été refusé par l'administration. ${updateData.rejectionReason ? `Motif: ${updateData.rejectionReason}` : ''}`,
            type: "PROJECT_REJECTED",
            data: JSON.stringify({
              projectId: updatedProject.id,
              projectTitle: updatedProject.title,
              rejectionReason: updateData.rejectionReason || "Aucun motif spécifié"
            })
          }
        });
        logger.debug("✅ Notification créée pour le concepteur (projet refusé)");
      } catch (notificationError) {
        logger.error("⚠️ Erreur création notification concepteur (refus):", notificationError);
      }
    }

    logger.debug("✅ Projet mis à jour:", updatedProject);

    return NextResponse.json(updatedProject);

  } catch (error: any) {
    logger.error("❌ Erreur mise à jour projet:", error);

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Supprimer un projet
export async function DELETE(request: NextRequest) {
  logger.debug("🔍 API DELETE /projects - Début de la requête");

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: "L'ID du projet est obligatoire" },
        { status: 400 }
      );
    }

    logger.debug("🔍 Suppression du projet:", projectId);

    // Vérifier que le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        concepteur: true,
        discipline: true
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier ownership (sauf pour PDG)
    const session = await getServerSession(authOptions);
    if (session?.user && session.user.role !== "PDG") {
      if (session.user.id !== existingProject.concepteurId) {
        return NextResponse.json(
          { error: "Vous ne pouvez supprimer que vos propres projets" },
          { status: 403 }
        );
      }
      // Vérifier que le projet peut être supprimé (seulement DRAFT pour concepteur)
      if (existingProject.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Seuls les projets en brouillon peuvent être supprimés" },
          { status: 400 }
        );
      }
    }

    // Supprimer le projet
    await prisma.project.delete({
      where: { id: projectId }
    });

    logger.debug("✅ Projet supprimé avec succès");

    // Créer une notification pour le concepteur
    try {
      await prisma.notification.create({
        data: {
          userId: existingProject.concepteurId,
          title: "Projet supprimé",
          message: `Votre projet "${existingProject.title}" a été supprimé avec succès.`,
          type: "PROJECT_DELETED",
          data: JSON.stringify({
            projectId: existingProject.id,
            projectTitle: existingProject.title
          })
        }
      });
      logger.debug("✅ Notification créée");
    } catch (notificationError) {
      logger.error("⚠️ Erreur création notification:", notificationError);
    }

    return NextResponse.json(
      { message: "Projet supprimé avec succès" },
      { status: 200 }
    );

  } catch (error: any) {
    logger.error("❌ Erreur suppression projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet: " + error.message },
      { status: 500 }
    );
  }
}
