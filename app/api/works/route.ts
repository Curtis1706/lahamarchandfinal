import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/works - Créer une œuvre (nouveau workflow)
export async function POST(request: NextRequest) {
  console.log("🔍 API POST /works - Création d'œuvre par Concepteur");
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    console.log("🔍 Body reçu:", body);
    
    const {
      title,
      description,
      disciplineId,
      authorId, // Seuls les auteurs peuvent créer des œuvres
      projectId,
      category,
      targetAudience,
      educationalObjectives,
      contentType,
      estimatedPrice = 0,
      keywords = [],
      files = [],
      status = "PENDING",
      collectionId,
      coverImage,
      isbn
    } = body;
    
    console.log("🔍 Données extraites:", { 
      title, 
      description,
      disciplineId, 
      authorId, 
      projectId,
      contentType,
      status 
    });
    
    console.log("🔍 Description reçue:", {
      description,
      type: typeof description,
      length: description?.length,
      trimmed: description?.trim(),
      isEmpty: !description?.trim()
    });

    // Validation des champs obligatoires
    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre de l'œuvre est obligatoire" }, { status: 400 });
    }
    
    if (!description?.trim()) {
      return NextResponse.json({ error: "La description de l'œuvre est obligatoire" }, { status: 400 });
    }

    if (!disciplineId) {
      return NextResponse.json({ error: "La discipline est obligatoire" }, { status: 400 });
    }

    if (!authorId) {
      return NextResponse.json({ error: "L'ID de l'auteur est obligatoire" }, { status: 400 });
    }

    if (!contentType) {
      return NextResponse.json({ error: "Le type de contenu est obligatoire" }, { status: 400 });
    }

    // Vérifier que l'utilisateur connecté a les permissions
    // Les concepteurs peuvent créer des œuvres pour n'importe quel auteur
    // Les auteurs ne peuvent créer que pour eux-mêmes
    // Les PDG peuvent créer pour n'importe qui
    const concepteurId = body.concepteurId || null;
    if (session.user.role === "AUTEUR" && session.user.id !== authorId && session.user.role !== "PDG") {
      return NextResponse.json({ error: "Vous ne pouvez créer une œuvre que pour vous-même" }, { status: 403 });
    }

    // Vérifier que la discipline existe
    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    });

    if (!discipline) {
      return NextResponse.json({ error: "Discipline non trouvée" }, { status: 404 });
    }

    // Vérifier que l'auteur existe et a le bon rôle
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!author) {
      return NextResponse.json({ error: "Auteur non trouvé" }, { status: 404 });
    }

    if (author.role !== "AUTEUR") {
      return NextResponse.json({ error: "Seul un utilisateur avec le rôle AUTEUR peut être assigné comme auteur" }, { status: 403 });
    }

    // Si un projectId est fourni, vérifier qu'il existe et est validé
    let project = null;
    let projectConcepteurId = null;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { 
          id: true, 
          title: true, 
          status: true, 
          concepteurId: true,
          concepteur: { select: { id: true, name: true, email: true } },
          discipline: { select: { name: true } }
        }
      });

      if (!project) {
        return NextResponse.json({ error: "Projet parent non trouvé" }, { status: 404 });
      }

      if (project.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Le projet parent doit être validé pour y rattacher une œuvre" }, { status: 400 });
      }

      // Récupérer l'ID du concepteur du projet pour l'assignation automatique
      projectConcepteurId = project.concepteurId;
      console.log(`✅ Projet validé trouvé: "${project.title}" par ${project.concepteur.name}`);
      console.log(`🔗 L'œuvre sera automatiquement assignée au concepteur: ${project.concepteur.name} (${project.concepteur.email})`);
    }

    // Déterminer le concepteurId : priorité au concepteurId fourni, puis au concepteur du projet, puis à l'utilisateur connecté si c'est un concepteur
    let finalConcepteurId = concepteurId || projectConcepteurId;
    if (!finalConcepteurId && session.user.role === "CONCEPTEUR") {
      finalConcepteurId = session.user.id;
    }

    // Générer un ISBN unique temporaire si non fourni
    const workIsbn = isbn || `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Créer l'œuvre
    const work = await prisma.work.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        isbn: workIsbn,
        price: estimatedPrice,
        tva: 0.18,
        stock: 0,
        minStock: 0,
        
        // Nouveaux champs
        category: category || null,
        targetAudience: targetAudience || null,
        educationalObjectives: educationalObjectives?.trim() || null,
        contentType: contentType,
        keywords: keywords.length > 0 ? keywords.join(',') : null,
        files: files.length > 0 || coverImage || collectionId ? JSON.stringify({ 
          files: files.length > 0 ? files : [],
          coverImage: coverImage || null,
          collectionId: collectionId || null
        }) : null,
        
        // Statut et dates
        status: status,
        submittedAt: status === "PENDING" ? new Date() : null,
        
        // Relations
        discipline: { connect: { id: disciplineId } },
        author: { connect: { id: authorId } },
        project: projectId ? { connect: { id: projectId } } : undefined,
        // Assignation au concepteur (du projet, fourni explicitement, ou utilisateur connecté si concepteur)
        concepteur: finalConcepteurId ? { connect: { id: finalConcepteurId } } : undefined
      },
      include: {
        author: {
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
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log("✅ Œuvre créée avec succès:", {
      id: work.id,
      title: work.title,
      status: work.status,
      author: work.author?.name || "Non défini",
      discipline: work.discipline?.name || "Non défini",
      project: work.project?.title || "Aucun projet parent",
      concepteur: work.concepteur?.name || "Non assigné"
    });

    // Créer un audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: "WORK_SUBMITTED",
          performedBy: session.user.name || "Auteur",
          details: `Nouvelle œuvre soumise: "${work.title}" par ${work.author?.name || "Auteur"} ${work.project ? `(projet: ${work.project.title})` : '(soumission directe)'}`,
          userId: session.user.id,
          metadata: JSON.stringify({
            workId: work.id,
            workTitle: work.title,
            concepteurId: work.concepteurId,
            disciplineId: work.disciplineId,
            projectId: work.projectId,
            contentType: work.contentType,
            status: work.status,
            submittedAt: work.submittedAt
          })
        }
      });
      console.log("✅ Audit log créé pour la soumission de l'œuvre");
    } catch (auditError) {
      console.error("⚠️ Erreur création audit log:", auditError);
    }

    // Créer des notifications pour les PDG
    try {
      const pdgUsers = await prisma.user.findMany({
        where: { role: "PDG", status: "ACTIVE" },
        select: { id: true, name: true }
      });

      for (const pdg of pdgUsers) {
        await prisma.notification.create({
          data: {
            userId: pdg.id,
            title: "Nouvelle œuvre soumise pour validation",
            message: `L'auteur ${work.author?.name} a soumis l'œuvre "${work.title}" pour validation. ${work.project ? `Issue du projet "${work.project.title}".` : 'Soumission directe.'}`,
            type: "WORK_SUBMITTED",
            data: JSON.stringify({
              workId: work.id,
              workTitle: work.title,
            authorId: work.authorId,
            authorName: work.author?.name,
              disciplineName: work.discipline?.name,
              projectId: work.projectId,
              projectTitle: work.project?.title,
              contentType: work.contentType
            })
          }
        });
      }
      console.log(`✅ Notifications créées pour ${pdgUsers.length} PDG`);
    } catch (notificationError) {
      console.error("⚠️ Erreur création notifications PDG:", notificationError);
    }

    return NextResponse.json(work, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la création de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/works - Récupérer les œuvres avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const status = searchParams.get('status');
    const disciplineId = searchParams.get('disciplineId');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construire les conditions de filtre
    let whereClause: any = {};


    if (authorId) {
      whereClause.authorId = authorId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (disciplineId) {
      whereClause.disciplineId = disciplineId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Si l'utilisateur n'est pas PDG, il ne peut voir que ses propres œuvres
    if (session.user.role !== "PDG") {
      if (session.user.role === "AUTEUR") {
        whereClause.authorId = session.user.id;
      }
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where: whereClause,
        include: {
          author: {
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
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          concepteur: {
            select: {
              id: true,
              name: true,
              email: true
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
        },
        skip,
        take: limit
      }),
      prisma.work.count({ where: whereClause })
    ]);

    // Calculer les statistiques globales (sans filtre de statut)
    const globalStats = await prisma.work.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalGlobal = await prisma.work.count();

    const statsFormatted = {
      total: totalGlobal,
      pending: globalStats.find(s => s.status === 'PENDING')?._count.status || 0,
      published: globalStats.find(s => s.status === 'PUBLISHED')?._count.status || 0,
      rejected: globalStats.find(s => s.status === 'REJECTED')?._count.status || 0,
      draft: globalStats.find(s => s.status === 'DRAFT')?._count.status || 0
    };

    console.log(`🔍 ${works.length} œuvre(s) trouvée(s) sur ${total}`);
    console.log("🔍 Statistiques globales calculées:", statsFormatted);

    return NextResponse.json({
      works,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsFormatted
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des œuvres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des œuvres: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/works - Mettre à jour une œuvre (validation PDG principalement)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { workId, status, validationComment, rejectionReason, ...updateData } = body;

    if (!workId) {
      return NextResponse.json({ error: "ID de l'œuvre requis" }, { status: 400 });
    }

    // Vérifier que l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwner = existingWork.authorId === session.user.id;
    const isPDG = session.user.role === "PDG";

    if (!isOwner && !isPDG) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres œuvres" }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const dataToUpdate: any = { ...updateData };

    // Si c'est une validation/refus par le PDG
    if (status && isPDG) {
      dataToUpdate.status = status;
      // Vérifier que l'utilisateur PDG existe avant d'assigner reviewerId
      let pdgUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      
      // Si l'utilisateur n'existe pas avec cet ID, chercher par email
      if (!pdgUser) {
        pdgUser = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        console.log(`🔍 Utilisateur PDG trouvé par email: ${pdgUser ? pdgUser.name : 'Non trouvé'}`);
      }
      
      if (pdgUser) {
        dataToUpdate.reviewerId = pdgUser.id;
        console.log(`✅ Reviewer assigné: ${pdgUser.name} (${pdgUser.id})`);
      } else {
        console.log("⚠️ Utilisateur PDG non trouvé, validation sans reviewerId");
      }
      
      dataToUpdate.reviewedAt = new Date();
      
      if (status === "PUBLISHED") {
        dataToUpdate.publishedAt = new Date();
      }
      
      if (validationComment) {
        dataToUpdate.validationComment = validationComment;
      }
      
      if (status === "REJECTED" && rejectionReason) {
        dataToUpdate.rejectionReason = rejectionReason;
      }
    }

    // Mettre à jour l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: dataToUpdate,
      include: {
        author: {
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
        project: {
          select: {
            id: true,
            title: true
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Créer audit log et notifications pour validation/refus
    if (status && isPDG && (status === "PUBLISHED" || status === "REJECTED")) {
      try {
        const action = status === "PUBLISHED" ? "WORK_APPROVED" : "WORK_REJECTED";
        await prisma.auditLog.create({
          data: {
            action: action,
            performedBy: session.user.name || "PDG",
            details: `Œuvre "${updatedWork.title}" ${status === "PUBLISHED" ? 'validée' : 'refusée'} par ${session.user.name}. ${validationComment || rejectionReason || ''}`,
            userId: session.user.id,
            metadata: JSON.stringify({
              workId: updatedWork.id,
              workTitle: updatedWork.title,
              newStatus: status,
              comment: validationComment || rejectionReason,
              reviewedAt: dataToUpdate.reviewedAt
            })
          }
        });

        // Notification à l'auteur
        const recipientId = updatedWork.authorId;
        if (recipientId) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              title: status === "PUBLISHED" ? "🎉 Œuvre validée !" : "❌ Œuvre refusée",
              message: status === "PUBLISHED" 
                ? `Votre œuvre "${updatedWork.title}" a été validée et est maintenant publiée ! ${validationComment ? `Commentaire: ${validationComment}` : ''}`
                : `Votre œuvre "${updatedWork.title}" a été refusée. ${rejectionReason ? `Motif: ${rejectionReason}` : ''} Vous pouvez la modifier et la resoumetre.`,
              type: status === "PUBLISHED" ? "WORK_APPROVED" : "WORK_REJECTED",
              data: JSON.stringify({
                workId: updatedWork.id,
                workTitle: updatedWork.title,
                status: status,
                comment: validationComment || rejectionReason
              })
            }
          });
        }

        console.log(`✅ Audit log et notification créés pour ${action}`);
      } catch (auditError) {
        console.error("⚠️ Erreur création audit/notifications:", auditError);
      }
    }

    return NextResponse.json(updatedWork, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/works - Supprimer une œuvre
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('id');

    if (!workId) {
      return NextResponse.json({ error: "ID de l'œuvre requis" }, { status: 400 });
    }

    // Vérifier que l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: { select: { name: true } },
        orderItems: true,
        sales: true
      }
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwner = existingWork.authorId === session.user.id;
    const isPDG = session.user.role === "PDG";

    if (!isOwner && !isPDG) {
      return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres œuvres" }, { status: 403 });
    }

    // Vérifier que l'œuvre peut être supprimée
    if (existingWork.status === "PUBLISHED" && !isPDG) {
      return NextResponse.json({ error: "Une œuvre publiée ne peut être supprimée que par un PDG" }, { status: 400 });
    }

    if (existingWork.orderItems.length > 0 || existingWork.sales.length > 0) {
      return NextResponse.json({ error: "Cette œuvre ne peut pas être supprimée car elle a des commandes ou ventes associées" }, { status: 400 });
    }

    // Supprimer l'œuvre
    await prisma.work.delete({
      where: { id: workId }
    });

    // Créer audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: "WORK_DELETED",
          performedBy: session.user.name || "Utilisateur",
          details: `Œuvre "${existingWork.title}" supprimée par ${session.user.name}`,
          userId: session.user.id,
          metadata: JSON.stringify({
            workId: existingWork.id,
            workTitle: existingWork.title,
            deletedAt: new Date().toISOString()
          })
        }
      });
    } catch (auditError) {
      console.error("⚠️ Erreur création audit log:", auditError);
    }

    return NextResponse.json({ message: "Œuvre supprimée avec succès" }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}