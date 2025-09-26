import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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
        console.log("⚠️ Relation works non disponible, continuation sans works");
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
    console.log("🔍 API Projects - Utilisateur:", session.user.email, "Rôle:", session.user.role);
    console.log("🔍 API Projects - Paramètres:", { concepteurId, status, includeWorks });
    console.log("🔍 API Projects - Clause where:", whereClause);

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: baseInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("🔍 API Projects - Résultat:", projects.length, "projets trouvés");
    if (projects.length > 0) {
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. "${project.title}" (${project.status}) - ${project.concepteur?.name}`);
      });
    }

    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  console.log("🔍 API POST /projects - Début de la requête");
  
  try {
    const body = await request.json();
    console.log("🔍 Body reçu:", body);
    
    const { 
      title, 
      disciplineId, 
      concepteurId, 
      description,
      status = "DRAFT" 
    } = body;
    
    console.log("🔍 Données extraites:", { title, disciplineId, concepteurId, description, status });

    // Validation des champs obligatoires
    if (!title || !disciplineId || !concepteurId) {
      return NextResponse.json(
        { error: "Le titre, la discipline et le concepteur sont obligatoires" },
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

    console.log("🔍 Tentative de création avec Prisma...");
    
    // Créer le projet dans le modèle Project
    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        discipline: {
          connect: { id: discipline.id }
        },
        concepteur: {
          connect: { id: concepteurId }
        },
        status: status
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

    console.log("✅ Projet créé, ajout des logs et notifications...");

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
            discipline: {
              connect: { id: discipline.id }
            },
            concepteur: {
              connect: { id: concepteurId }
            },
            projectId: project.id
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

        console.log("✅ Œuvre créée automatiquement:", work);

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
                  concepteurId: concepteurId,
                  concepteurName: project.concepteur.name,
                  discipline: work.discipline.name,
                  isbn: work.isbn
                })
              }
            });
            console.log("✅ Notification créée pour le PDG");
          }
        } catch (notificationError) {
          console.error("⚠️ Erreur création notification PDG:", notificationError);
        }

        // Créer une notification pour le concepteur
        try {
          await prisma.notification.create({
            data: {
              userId: concepteurId,
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
          console.log("✅ Notification créée pour le concepteur");
        } catch (notificationError) {
          console.error("⚠️ Erreur création notification concepteur:", notificationError);
        }

      } catch (workError) {
        console.error("⚠️ Erreur création œuvre automatique:", workError);
        // Ne pas faire échouer la création du projet pour une erreur d'œuvre
      }
    }

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "PROJECT_CREATE",
          userId: concepteurId,
          performedBy: concepteurId,
          details: JSON.stringify({
            projectId: project.id,
            projectTitle: project.title,
            status: status,
            discipline: project.discipline.name
          })
        }
      });
      console.log("✅ Log d'audit créé");
    } catch (auditError) {
      console.error("⚠️ Erreur création log d'audit:", auditError);
    }

    // Créer une notification pour le concepteur
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
          userId: concepteurId,
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
      console.log("✅ Notification créée");
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    console.log("✅ Projet créé avec succès:", project);
    
    return NextResponse.json(project, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Erreur création projet:", error);
    console.error("❌ Stack:", error.stack);
    
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
  console.log("🔍 API PUT /projects - Mise à jour de projet");
  
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
    if (status === "ACCEPTED" && existingProject.status !== "ACCEPTED") {
      try {
        // 1. Enregistrer la date de validation et le validateur pour traçabilité
        await prisma.project.update({
          where: { id: projectId },
          data: {
            reviewerId: userId,
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

        // 3. Créer une entrée dans l'historique/audit pour traçabilité complète
        await prisma.auditLog.create({
          data: {
            action: "PROJECT_VALIDATED",
            performedBy: session.user.name || "PDG",
            details: `Projet "${updatedProject.title}" validé par ${session.user.name}. Le concepteur ${updatedProject.concepteur.name} peut maintenant créer des œuvres associées. Discipline: ${updatedProject.discipline.name}.`,
            userId: userId,
            metadata: JSON.stringify({
              projectId: updatedProject.id,
              projectTitle: updatedProject.title,
              concepteurId: updatedProject.concepteurId,
              concepteurName: updatedProject.concepteur.name,
              disciplineId: updatedProject.disciplineId,
              disciplineName: updatedProject.discipline.name,
              validationDate: new Date().toISOString(),
              validatedBy: session.user.name
            })
          }
        });

        console.log(`✅ Projet "${updatedProject.title}" validé - Workflow complet déclenché:`);
        console.log(`   • Concepteur: ${updatedProject.concepteur.name}`);
        console.log(`   • Discipline: ${updatedProject.discipline.name}`);
        console.log(`   • Validé par: ${session.user.name}`);
        console.log(`   • Fonctionnalités œuvres débloquées`);

      } catch (workflowError) {
        console.error("❌ Erreur lors du workflow de validation:", workflowError);
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
        console.log("✅ Notification créée pour le concepteur (projet refusé)");
      } catch (notificationError) {
        console.error("⚠️ Erreur création notification concepteur (refus):", notificationError);
      }
    }

    console.log("✅ Projet mis à jour:", updatedProject);
    
    return NextResponse.json(updatedProject);
    
  } catch (error) {
    console.error("❌ Erreur mise à jour projet:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Supprimer un projet
export async function DELETE(request: NextRequest) {
  console.log("🔍 API DELETE /projects - Début de la requête");
  
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json(
        { error: "L'ID du projet est obligatoire" },
        { status: 400 }
      );
    }

    console.log("🔍 Suppression du projet:", projectId);

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

    // Supprimer le projet
    await prisma.project.delete({
      where: { id: projectId }
    });

    console.log("✅ Projet supprimé avec succès");

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "PROJECT_DELETE",
          userId: existingProject.concepteurId,
          performedBy: existingProject.concepteurId,
          details: JSON.stringify({
            projectId: existingProject.id,
            projectTitle: existingProject.title,
            discipline: existingProject.discipline.name
          })
        }
      });
      console.log("✅ Log d'audit créé");
    } catch (auditError) {
      console.error("⚠️ Erreur création log d'audit:", auditError);
    }

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
      console.log("✅ Notification créée");
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    return NextResponse.json(
      { message: "Projet supprimé avec succès" },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("❌ Erreur suppression projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet: " + error.message },
      { status: 500 }
    );
  }
}
