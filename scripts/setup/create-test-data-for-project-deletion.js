const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestData() {
  console.log("🎯 Création de données de test pour suppression de projet");
  console.log("======================================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // 1. Créer une discipline de test
    console.log("\n1. 📚 Création d'une discipline de test...");
    const testDiscipline = await prisma.discipline.create({
      data: {
        name: "Littérature"
      }
    });
    console.log(`✅ Discipline créée: ${testDiscipline.name}`);

    // 2. Créer un utilisateur concepteur de test
    console.log("\n2. 👤 Création d'un concepteur de test...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const testConcepteur = await prisma.user.create({
      data: {
        name: "Alphonse Concepteur",
        email: "alphonse.concepteur@test.com",
        password: hashedPassword,
        role: "CONCEPTEUR",
        status: "ACTIVE",
        disciplineId: testDiscipline.id
      }
    });
    console.log(`✅ Concepteur créé: ${testConcepteur.name}`);

    // 3. Créer un utilisateur PDG de test
    console.log("\n3. 👨‍💼 Création d'un PDG de test...");
    const testPDG = await prisma.user.create({
      data: {
        name: "PDG Test",
        email: "pdg@test.com",
        password: hashedPassword,
        role: "PDG",
        status: "ACTIVE"
      }
    });
    console.log(`✅ PDG créé: ${testPDG.name}`);

    // 4. Créer des projets de test avec différents statuts
    console.log("\n4. 📋 Création de projets de test...");

    // Projet DRAFT (supprimable)
    const draftProject = await prisma.project.create({
      data: {
        title: "Manuel de Français 2nde - DRAFT",
        description: "Un manuel complet pour la classe de seconde",
        objectives: "Améliorer la compréhension littéraire",
        expectedDeliverables: "Manuel de 300 pages avec exercices",
        requiredResources: "Équipe de relecture, illustrations",
        timeline: "6 mois de développement",
        status: "DRAFT",
        concepteurId: testConcepteur.id,
        disciplineId: testDiscipline.id
      }
    });
    console.log(`✅ Projet DRAFT créé: ${draftProject.title}`);

    // Projet SUBMITTED (non supprimable)
    const submittedProject = await prisma.project.create({
      data: {
        title: "Manuel de Chimie - SUBMITTED",
        description: "Manuel de chimie pour lycée",
        status: "SUBMITTED",
        submittedAt: new Date(),
        concepteurId: testConcepteur.id,
        disciplineId: testDiscipline.id
      }
    });
    console.log(`✅ Projet SUBMITTED créé: ${submittedProject.title}`);

    // Projet ACCEPTED (non supprimable)
    const acceptedProject = await prisma.project.create({
      data: {
        title: "Manuel de Mathématiques - ACCEPTED",
        description: "Manuel de mathématiques avancées",
        status: "ACCEPTED",
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
        reviewedAt: new Date(),
        concepteurId: testConcepteur.id,
        reviewerId: testPDG.id,
        disciplineId: testDiscipline.id
      }
    });
    console.log(`✅ Projet ACCEPTED créé: ${acceptedProject.title}`);

    // 5. Créer une œuvre associée au projet accepté (pour tester la contrainte d'intégrité)
    console.log("\n5. 📖 Création d'une œuvre associée...");
    const testWork = await prisma.work.create({
      data: {
        title: "Œuvre issue du projet accepté",
        isbn: "978-2-1234-5678-9",
        price: 25.99,
        tva: 0.18,
        stock: 100,
        minStock: 10,
        status: "PENDING",
        concepteurId: testConcepteur.id,
        disciplineId: testDiscipline.id,
        projectId: acceptedProject.id
      }
    });
    console.log(`✅ Œuvre créée: ${testWork.title}`);

    console.log("\n📊 RÉSUMÉ DES DONNÉES DE TEST:");
    console.log("===============================");
    console.log(`👤 Concepteur: ${testConcepteur.name} (${testConcepteur.email})`);
    console.log(`👨‍💼 PDG: ${testPDG.name} (${testPDG.email})`);
    console.log(`📚 Discipline: ${testDiscipline.name}`);
    console.log(`📋 Projets créés:`);
    console.log(`   • ${draftProject.title} (DRAFT) ✅ SUPPRIMABLE`);
    console.log(`   • ${submittedProject.title} (SUBMITTED) ❌ NON SUPPRIMABLE`);
    console.log(`   • ${acceptedProject.title} (ACCEPTED) ❌ NON SUPPRIMABLE`);
    console.log(`📖 Œuvre: ${testWork.title} (liée au projet accepté)`);

    console.log("\n🧪 TESTS À EFFECTUER:");
    console.log("======================");
    console.log("1. Se connecter en tant que concepteur:");
    console.log(`   Email: ${testConcepteur.email}`);
    console.log(`   Mot de passe: password123`);
    console.log("\n2. Aller sur /dashboard/concepteur/mes-projets");
    console.log("\n3. Tenter de supprimer:");
    console.log(`   ✅ "${draftProject.title}" → DOIT FONCTIONNER`);
    console.log(`   ❌ "${submittedProject.title}" → ICÔNE SUPPRESSION INVISIBLE`);
    console.log(`   ❌ "${acceptedProject.title}" → ICÔNE SUPPRESSION INVISIBLE`);
    console.log("\n4. Se connecter en tant que PDG:");
    console.log(`   Email: ${testPDG.email}`);
    console.log(`   Mot de passe: password123`);

  } catch (error) {
    console.error("❌ Erreur lors de la création des données:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

createTestData().catch(console.error);
