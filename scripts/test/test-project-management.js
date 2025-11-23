const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProjectManagement() {
  try {
    console.log("🧪 Test de la gestion des projets");
    console.log("=================================");

    // 1. Trouver un Concepteur
    const concepteur = await prisma.user.findFirst({
      where: { role: 'CONCEPTEUR' },
    });

    if (!concepteur) {
      console.error("❌ Aucun concepteur trouvé. Veuillez créer un concepteur d'abord.");
      return;
    }

    console.log("✅ Concepteur trouvé:", concepteur.name);

    // 2. Trouver une Discipline
    const discipline = await prisma.discipline.findFirst();

    if (!discipline) {
      console.error("❌ Aucune discipline trouvée. Veuillez créer une discipline d'abord.");
      return;
    }

    console.log("✅ Discipline trouvée:", discipline.name);

    // 3. Trouver le PDG
    const pdg = await prisma.user.findFirst({
      where: { role: 'PDG' },
    });

    if (!pdg) {
      console.error("❌ Aucun PDG trouvé. Veuillez créer un PDG d'abord.");
      return;
    }

    console.log("✅ PDG trouvé:", pdg.name);

    console.log("\n📋 Test 1: Création et soumission de projets");
    console.log("---------------------------------------------");

    // 4. Créer plusieurs projets avec différents statuts
    const projects = [
      {
        title: "Projet Mathématiques Interactives",
        description: "Développement d'une plateforme d'apprentissage des mathématiques avec des exercices interactifs et des vidéos pédagogiques.",
        status: "DRAFT"
      },
      {
        title: "Collection Littérature Africaine",
        description: "Création d'une collection de livres de littérature africaine pour les élèves du secondaire avec des analyses et des questions de compréhension.",
        status: "SUBMITTED"
      },
      {
        title: "Cours de Sciences Physiques",
        description: "Élaboration d'un cours complet de sciences physiques avec des expériences virtuelles et des simulations.",
        status: "UNDER_REVIEW"
      },
      {
        title: "Manuel d'Histoire du Cameroun",
        description: "Rédaction d'un manuel d'histoire du Cameroun adapté aux programmes scolaires avec des cartes et des illustrations.",
        status: "ACCEPTED"
      },
      {
        title: "Projet Informatique Rejeté",
        description: "Projet de cours d'informatique qui a été rejeté pour non-conformité aux standards pédagogiques.",
        status: "REJECTED"
      }
    ];

    const createdProjects = [];

    for (const projectData of projects) {
      const project = await prisma.project.create({
        data: {
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          disciplineId: discipline.id,
          concepteurId: concepteur.id,
          submittedAt: projectData.status !== "DRAFT" ? new Date() : null,
          reviewedAt: projectData.status === "ACCEPTED" || projectData.status === "REJECTED" ? new Date() : null,
          reviewerId: projectData.status === "ACCEPTED" || projectData.status === "REJECTED" ? pdg.id : null
        },
        include: {
          concepteur: {
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
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      createdProjects.push(project);
      console.log(`✅ Projet créé: ${project.title} (${project.status})`);
    }

    console.log("\n📋 Test 2: Création d'œuvres pour les projets acceptés");
    console.log("-----------------------------------------------------");

    // 5. Créer des œuvres pour les projets acceptés
    const acceptedProject = createdProjects.find(p => p.status === "ACCEPTED");
    
    if (acceptedProject) {
      const isbn = `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const work = await prisma.work.create({
        data: {
          title: acceptedProject.title,
          isbn: isbn,
          price: 25000,
          stock: 500,
          minStock: 50,
          maxStock: 1000,
          status: "PUBLISHED",
          disciplineId: discipline.id,
          concepteurId: concepteur.id,
          projectId: acceptedProject.id
        },
        include: {
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
          discipline: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Œuvre créée pour le projet accepté: ${work.title}`);
      console.log(`   - ISBN: ${work.isbn}`);
      console.log(`   - Prix: ${work.price} FCFA`);
      console.log(`   - Statut: ${work.status}`);
    }

    console.log("\n📋 Test 3: Création de notifications");
    console.log("------------------------------------");

    // 6. Créer des notifications pour les différents événements
    const notifications = [
      {
        userId: concepteur.id,
        title: "Projet soumis avec succès",
        message: "Votre projet 'Collection Littérature Africaine' a été soumis pour validation.",
        type: "PROJECT_SUBMITTED",
        data: JSON.stringify({
          projectId: createdProjects.find(p => p.status === "SUBMITTED")?.id,
          projectTitle: "Collection Littérature Africaine"
        })
      },
      {
        userId: concepteur.id,
        title: "Projet accepté",
        message: "Félicitations ! Votre projet 'Manuel d'Histoire du Cameroun' a été accepté par le PDG.",
        type: "PROJECT_ACCEPTED",
        data: JSON.stringify({
          projectId: acceptedProject?.id,
          projectTitle: "Manuel d'Histoire du Cameroun"
        })
      },
      {
        userId: concepteur.id,
        title: "Projet refusé",
        message: "Votre projet 'Projet Informatique Rejeté' a été refusé. Motif: Non-conformité aux standards pédagogiques.",
        type: "PROJECT_REJECTED",
        data: JSON.stringify({
          projectId: createdProjects.find(p => p.status === "REJECTED")?.id,
          projectTitle: "Projet Informatique Rejeté",
          reason: "Non-conformité aux standards pédagogiques"
        })
      }
    ];

    for (const notificationData of notifications) {
      const notification = await prisma.notification.create({
        data: notificationData
      });
      console.log(`✅ Notification créée: ${notification.title}`);
    }

    console.log("\n📊 Résumé des tests");
    console.log("===================");

    // Compter les projets par statut
    const projectStats = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log("📁 Répartition des projets par statut:");
    projectStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.id}`);
    });

    // Compter les œuvres avec projets
    const worksWithProjects = await prisma.work.count({
      where: { projectId: { not: null } },
    });

    console.log("🔗 Œuvres créées à partir de projets:", worksWithProjects);

    // Compter les notifications
    const notificationCount = await prisma.notification.count();
    console.log("🔔 Notifications créées:", notificationCount);

    // Compter les notifications non lues
    const unreadNotifications = await prisma.notification.count({
      where: { read: false },
    });
    console.log("🔔 Notifications non lues:", unreadNotifications);

    console.log("\n✅ Tests de gestion des projets terminés avec succès!");
    console.log("\n💡 Prochaines étapes:");
    console.log("   1. Testez la page /dashboard/pdg/gestion-projets");
    console.log("   2. Vérifiez la liste des projets avec leurs statuts");
    console.log("   3. Testez la validation/refus des projets");
    console.log("   4. Vérifiez les notifications reçues par les concepteurs");

  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectManagement();

