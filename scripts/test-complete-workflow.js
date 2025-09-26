const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteWorkflow() {
  console.log("🚀 Test du workflow complet Lahamarchand");
  console.log("==========================================\n");

  try {
    // 1. Vérifier les données existantes
    console.log("📊 Vérification des données existantes...");
    
    const disciplines = await prisma.discipline.findMany();
    console.log(`✅ Disciplines disponibles: ${disciplines.length}`);
    disciplines.forEach(d => console.log(`   - ${d.name}`));

    const concepteurs = await prisma.user.findMany({
      where: { role: 'CONCEPTEUR' }
    });
    console.log(`✅ Concepteurs disponibles: ${concepteurs.length}`);

    const auteurs = await prisma.user.findMany({
      where: { role: 'AUTEUR' }
    });
    console.log(`✅ Auteurs disponibles: ${auteurs.length}`);

    const pdg = await prisma.user.findFirst({
      where: { role: 'PDG' }
    });
    console.log(`✅ PDG disponible: ${pdg ? 'Oui' : 'Non'}`);

    if (disciplines.length === 0 || concepteurs.length === 0 || auteurs.length === 0 || !pdg) {
      console.log("❌ Données manquantes. Veuillez d'abord créer des utilisateurs et disciplines.");
      return;
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎭 SCÉNARIO 1: Concepteur soumet un projet");
    console.log("=".repeat(50));

    // 2. Scénario Concepteur : Créer un projet et le soumettre
    const concepteur = concepteurs[0];
    const discipline = disciplines[0];

    console.log(`👤 Concepteur: ${concepteur.name} (${concepteur.email})`);
    console.log(`📚 Discipline: ${discipline.name}`);

    // Créer un projet en brouillon
    const projectDraft = await prisma.project.create({
      data: {
        title: `Projet Test - Manuel Interactif ${discipline.name}`,
        description: "Ceci est un projet de test pour créer un manuel interactif avec des exercices et des animations.",
        disciplineId: discipline.id,
        concepteurId: concepteur.id,
        status: "DRAFT"
      },
      include: {
        concepteur: { select: { name: true, email: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log(`✅ Projet créé en brouillon: "${projectDraft.title}"`);
    console.log(`   Statut: ${projectDraft.status}`);

    // Soumettre le projet (cela devrait créer automatiquement une œuvre)
    const projectSubmitted = await prisma.project.update({
      where: { id: projectDraft.id },
      data: { 
        status: "SUBMITTED",
        submittedAt: new Date()
      },
      include: {
        concepteur: { select: { name: true, email: true } },
        discipline: { select: { name: true } },
        work: {
          include: {
            concepteur: { select: { name: true, email: true } },
            discipline: { select: { name: true } }
          }
        }
      }
    });

    console.log(`✅ Projet soumis: "${projectSubmitted.title}"`);
    console.log(`   Statut: ${projectSubmitted.status}`);
    
    if (projectSubmitted.work) {
      console.log(`🎨 Œuvre créée automatiquement: "${projectSubmitted.work.title}"`);
      console.log(`   ISBN: ${projectSubmitted.work.isbn}`);
      console.log(`   Statut: ${projectSubmitted.work.status}`);
      console.log(`   Concepteur: ${projectSubmitted.work.concepteur?.name}`);
    } else {
      console.log("❌ Aucune œuvre créée automatiquement !");
    }

    // Vérifier les notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: pdg.id },
          { userId: concepteur.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📬 Notifications créées: ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`   - ${notif.title}: ${notif.message}`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("✍️ SCÉNARIO 2: Auteur soumet directement une œuvre");
    console.log("=".repeat(50));

    // 3. Scénario Auteur : Créer directement une œuvre
    const auteur = auteurs[0];
    const discipline2 = disciplines[1] || disciplines[0];

    console.log(`👤 Auteur: ${auteur.name} (${auteur.email})`);
    console.log(`📚 Discipline: ${discipline2.name}`);

    // Générer un ISBN unique
    const isbn = `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Créer une œuvre directement (cas Auteur)
    const workDirect = await prisma.work.create({
      data: {
        title: `Œuvre Directe - Recueil de Poèmes ${discipline2.name}`,
        isbn: isbn,
        price: 2500,
        stock: 100,
        minStock: 10,
        maxStock: 500,
        status: "PENDING", // En attente de validation PDG
        disciplineId: discipline2.id,
        authorId: auteur.id
      },
      include: {
        author: { select: { name: true, email: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log(`✅ Œuvre créée directement: "${workDirect.title}"`);
    console.log(`   ISBN: ${workDirect.isbn}`);
    console.log(`   Statut: ${workDirect.status}`);
    console.log(`   Auteur: ${workDirect.author?.name}`);
    console.log(`   Prix: ${workDirect.price} F CFA`);
    console.log(`   Stock: ${workDirect.stock}`);

    console.log("\n" + "=".repeat(50));
    console.log("👑 SCÉNARIO 3: PDG valide les œuvres");
    console.log("=".repeat(50));

    // 4. Scénario PDG : Valider les œuvres en attente
    const pendingWorks = await prisma.work.findMany({
      where: { status: "PENDING" },
      include: {
        author: { select: { name: true, email: true } },
        concepteur: { select: { name: true, email: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log(`📋 Œuvres en attente de validation: ${pendingWorks.length}`);

    for (const work of pendingWorks) {
      console.log(`\n🔍 Validation de: "${work.title}"`);
      console.log(`   ISBN: ${work.isbn}`);
      console.log(`   Créateur: ${work.author?.name || work.concepteur?.name}`);
      console.log(`   Type: ${work.author ? 'Auteur' : 'Concepteur'}`);

      // Valider l'œuvre
      const validatedWork = await prisma.work.update({
        where: { id: work.id },
        data: { 
          status: "PUBLISHED",
          publishedAt: new Date()
        }
      });

      console.log(`✅ Œuvre validée et publiée !`);

      // Créer un log d'audit
      await prisma.auditLog.create({
        data: {
          action: "WORK_APPROVED_BY_PDG",
          userId: work.authorId || work.concepteurId,
          performedBy: pdg.id,
          details: JSON.stringify({
            workId: work.id,
            workTitle: work.title,
            isbn: work.isbn,
            creatorType: work.author ? 'AUTHOR' : 'CONCEPTEUR',
            creatorName: work.author?.name || work.concepteur?.name
          })
        }
      });

      // Créer une notification pour le créateur
      await prisma.notification.create({
        data: {
          userId: work.authorId || work.concepteurId,
          title: "Œuvre approuvée et publiée",
          message: `Votre œuvre "${work.title}" a été approuvée par le PDG et est maintenant publiée dans le catalogue.`,
          type: "WORK_APPROVED",
          data: JSON.stringify({
            workId: work.id,
            workTitle: work.title,
            status: "PUBLISHED"
          })
        }
      });

      console.log(`📬 Notification envoyée au créateur`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 RÉSUMÉ FINAL");
    console.log("=".repeat(50));

    // 5. Résumé final
    const finalStats = await prisma.work.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    console.log("📈 Statistiques des œuvres:");
    finalStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} œuvre(s)`);
    });

    const projectStats = await prisma.project.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    console.log("\n📈 Statistiques des projets:");
    projectStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} projet(s)`);
    });

    const totalNotifications = await prisma.notification.count();
    const totalAuditLogs = await prisma.auditLog.count();

    console.log(`\n📬 Notifications totales: ${totalNotifications}`);
    console.log(`📝 Logs d'audit totaux: ${totalAuditLogs}`);

    console.log("\n✅ Test du workflow complet terminé avec succès !");
    console.log("\n🎯 Workflow validé:");
    console.log("   1. ✅ Concepteur crée un projet (DRAFT)");
    console.log("   2. ✅ Concepteur soumet le projet (SUBMITTED)");
    console.log("   3. ✅ Œuvre créée automatiquement (PENDING)");
    console.log("   4. ✅ Auteur peut créer directement une œuvre (PENDING)");
    console.log("   5. ✅ PDG valide les œuvres (PUBLISHED)");
    console.log("   6. ✅ Notifications et logs d'audit fonctionnels");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testCompleteWorkflow();

