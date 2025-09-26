const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetTestData() {
  console.log("🔄 Réinitialisation des données de test");
  console.log("======================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Créer les disciplines
    console.log("\n📚 Création des disciplines...");
    const disciplines = [
      { name: "Mathématiques" },
      { name: "Français" },
      { name: "Littérature" },
      { name: "Anglais" },
      { name: "Sciences" }
    ];

    for (const discipline of disciplines) {
      await prisma.discipline.upsert({
        where: { name: discipline.name },
        update: {},
        create: discipline
      });
    }
    console.log("✅ Disciplines créées");

    // Créer les utilisateurs de test
    console.log("\n👥 Création des utilisateurs de test...");
    
    const users = [
      {
        name: "Gislain Auteur",
        email: "gislain@gmail.com",
        phone: "96005482",
        password: await bcrypt.hash('password123', 10),
        role: "AUTEUR",
        status: "APPROVED"
      },
      {
        name: "Koffi LOSSA",
        email: "koffi.concepteur@gmail.com",
        phone: "96005483",
        password: await bcrypt.hash('password123', 10),
        role: "CONCEPTEUR",
        status: "APPROVED"
      },
      {
        name: "Alphonse Concepteur",
        email: "alphonse.concepteur@gmail.com",
        phone: "96005484",
        password: await bcrypt.hash('password123', 10),
        role: "CONCEPTEUR",
        status: "APPROVED"
      },
      {
        name: "Admin PDG",
        email: "admin@lahamarchand.com",
        phone: "96005485",
        password: await bcrypt.hash('password123', 10),
        role: "PDG",
        status: "APPROVED"
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData
      });
      createdUsers.push(user);
    }
    console.log("✅ Utilisateurs créés");

    // Assigner des disciplines aux concepteurs
    const mathDiscipline = await prisma.discipline.findUnique({ where: { name: "Mathématiques" } });
    const francaisDiscipline = await prisma.discipline.findUnique({ where: { name: "Français" } });
    const litteratureDiscipline = await prisma.discipline.findUnique({ where: { name: "Littérature" } });
    const anglaisDiscipline = await prisma.discipline.findUnique({ where: { name: "Anglais" } });

    const koffi = createdUsers.find(u => u.email === "koffi.concepteur@gmail.com");
    const alphonse = createdUsers.find(u => u.email === "alphonse.concepteur@gmail.com");
    const gislain = createdUsers.find(u => u.email === "gislain@gmail.com");

    if (koffi && francaisDiscipline) {
      await prisma.user.update({
        where: { id: koffi.id },
        data: { disciplineId: francaisDiscipline.id }
      });
    }

    if (alphonse && litteratureDiscipline) {
      await prisma.user.update({
        where: { id: alphonse.id },
        data: { disciplineId: litteratureDiscipline.id }
      });
    }

    if (gislain && mathDiscipline) {
      await prisma.user.update({
        where: { id: gislain.id },
        data: { disciplineId: mathDiscipline.id }
      });
    }

    // Créer des projets validés
    console.log("\n📋 Création des projets validés...");
    
    const projects = [
      {
        title: "Manuel de Français",
        description: "Manuel complet de français pour le primaire",
        objectives: "Apprentissage de la langue française",
        expectedDeliverables: "Manuel, exercices, corrigés",
        requiredResources: "Équipe pédagogique, illustrations",
        timeline: "6 mois",
        status: "ACCEPTED",
        concepteurId: koffi.id,
        disciplineId: francaisDiscipline.id,
        submittedAt: new Date(),
        reviewedAt: new Date()
      },
      {
        title: "Manuel de Mathématiques - ACCEPTED",
        description: "Manuel de mathématiques pour CE1",
        objectives: "Apprentissage des bases mathématiques",
        expectedDeliverables: "Manuel, cahier d'exercices",
        requiredResources: "Équipe pédagogique, matériel didactique",
        timeline: "4 mois",
        status: "ACCEPTED",
        concepteurId: alphonse.id,
        disciplineId: litteratureDiscipline.id,
        submittedAt: new Date(),
        reviewedAt: new Date()
      },
      {
        title: "Projet de Destruction des incompétents",
        description: "Projet éducatif innovant",
        objectives: "Amélioration de la qualité éducative",
        expectedDeliverables: "Guide méthodologique",
        requiredResources: "Équipe spécialisée",
        timeline: "3 mois",
        status: "ACCEPTED",
        concepteurId: koffi.id,
        disciplineId: anglaisDiscipline.id,
        submittedAt: new Date(),
        reviewedAt: new Date()
      }
    ];

    for (const projectData of projects) {
      await prisma.project.create({
        data: projectData
      });
    }
    console.log("✅ Projets validés créés");

    console.log("\n🎯 COMPTES DE TEST CRÉÉS:");
    console.log("==========================");
    console.log("📧 Auteur: gislain@gmail.com / password123");
    console.log("📧 Concepteur: koffi.concepteur@gmail.com / password123");
    console.log("📧 Concepteur: alphonse.concepteur@gmail.com / password123");
    console.log("📧 PDG: admin@lahamarchand.com / password123");

    console.log("\n✅ RÉINITIALISATION TERMINÉE !");
    console.log("==============================");
    console.log("La base de données est maintenant synchronisée avec le nouveau schéma.");
    console.log("Les erreurs de colonnes manquantes devraient être résolues.");

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

resetTestData().catch(console.error);
