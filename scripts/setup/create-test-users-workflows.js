const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("👥 Création d'utilisateurs de test");
    console.log("=================================");

    // 1. Créer des disciplines si elles n'existent pas
    const disciplines = [
      { name: "Mathématiques" },
      { name: "Sciences Physiques" },
      { name: "Littérature" },
      { name: "Histoire-Géographie" },
      { name: "Informatique" },
      { name: "Langues" }
    ];

    console.log("📚 Création des disciplines...");
    for (const disciplineData of disciplines) {
      const existingDiscipline = await prisma.discipline.findFirst({
        where: { name: disciplineData.name }
      });

      if (!existingDiscipline) {
        const discipline = await prisma.discipline.create({
          data: disciplineData
        });
        console.log(`✅ Discipline créée: ${discipline.name}`);
      } else {
        console.log(`ℹ️ Discipline existante: ${existingDiscipline.name}`);
      }
    }

    // 2. Créer un PDG
    const pdgData = {
      name: "PDG Admin",
      email: "pdg@lahamarchand.com",
      phone: "+237 123 456 789",
      password: await bcrypt.hash("password123", 10),
      role: "PDG",
      status: "ACTIVE"
    };

    const existingPDG = await prisma.user.findFirst({
      where: { role: "PDG" }
    });

    if (!existingPDG) {
      const pdg = await prisma.user.create({
        data: pdgData
      });
      console.log("✅ PDG créé:", pdg.name);
    } else {
      console.log("ℹ️ PDG existant:", existingPDG.name);
    }

    // 3. Créer des Concepteurs
    const concepteursData = [
      {
        name: "Alphonse Concepteur",
        email: "alphonse.concepteur@example.com",
        phone: "+237 111 222 333",
        password: await bcrypt.hash("password123", 10),
        role: "CONCEPTEUR",
        status: "ACTIVE",
        disciplineId: (await prisma.discipline.findFirst({ where: { name: "Mathématiques" } }))?.id
      },
      {
        name: "Marie Conceptrice",
        email: "marie.conceptrice@example.com",
        phone: "+237 444 555 666",
        password: await bcrypt.hash("password123", 10),
        role: "CONCEPTEUR",
        status: "ACTIVE",
        disciplineId: (await prisma.discipline.findFirst({ where: { name: "Littérature" } }))?.id
      }
    ];

    console.log("👨‍💼 Création des concepteurs...");
    for (const concepteurData of concepteursData) {
      const existingConcepteur = await prisma.user.findFirst({
        where: { email: concepteurData.email }
      });

      if (!existingConcepteur) {
        const concepteur = await prisma.user.create({
          data: concepteurData
        });
        console.log(`✅ Concepteur créé: ${concepteur.name}`);
      } else {
        console.log(`ℹ️ Concepteur existant: ${existingConcepteur.name}`);
      }
    }

    // 4. Créer des Auteurs
    const auteursData = [
      {
        name: "Jean Auteur",
        email: "jean.auteur@example.com",
        phone: "+237 777 888 999",
        password: await bcrypt.hash("password123", 10),
        role: "AUTEUR",
        status: "ACTIVE",
        disciplineId: (await prisma.discipline.findFirst({ where: { name: "Histoire-Géographie" } }))?.id
      },
      {
        name: "Sophie Auteure",
        email: "sophie.auteure@example.com",
        phone: "+237 000 111 222",
        password: await bcrypt.hash("password123", 10),
        role: "AUTEUR",
        status: "ACTIVE",
        disciplineId: (await prisma.discipline.findFirst({ where: { name: "Sciences Physiques" } }))?.id
      }
    ];

    console.log("✍️ Création des auteurs...");
    for (const auteurData of auteursData) {
      const existingAuteur = await prisma.user.findFirst({
        where: { email: auteurData.email }
      });

      if (!existingAuteur) {
        const auteur = await prisma.user.create({
          data: auteurData
        });
        console.log(`✅ Auteur créé: ${auteur.name}`);
      } else {
        console.log(`ℹ️ Auteur existant: ${existingAuteur.name}`);
      }
    }

    // 5. Créer un Représentant
    const representantData = {
      name: "Pierre Représentant",
      email: "pierre.representant@example.com",
      phone: "+237 333 444 555",
      password: await bcrypt.hash("password123", 10),
      role: "REPRESENTANT",
      status: "ACTIVE"
    };

    const existingRepresentant = await prisma.user.findFirst({
      where: { role: "REPRESENTANT" }
    });

    if (!existingRepresentant) {
      const representant = await prisma.user.create({
        data: representantData
      });
      console.log("✅ Représentant créé:", representant.name);
    } else {
      console.log("ℹ️ Représentant existant:", existingRepresentant.name);
    }

    console.log("\n📊 Résumé des utilisateurs créés");
    console.log("================================");

    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    userCounts.forEach(count => {
      console.log(`👤 ${count.role}: ${count._count.id}`);
    });

    console.log("\n🔑 Identifiants de connexion");
    console.log("===========================");
    console.log("PDG: pdg@lahamarchand.com / password123");
    console.log("Concepteur: alphonse.concepteur@example.com / password123");
    console.log("Auteur: jean.auteur@example.com / password123");
    console.log("Représentant: pierre.representant@example.com / password123");

    console.log("\n✅ Utilisateurs de test créés avec succès!");
    console.log("\n💡 Vous pouvez maintenant:");
    console.log("   1. Exécuter le script test-project-work-workflows.js");
    console.log("   2. Tester les workflows dans l'interface utilisateur");
    console.log("   3. Vérifier les tableaux de bord spécifiques");

  } catch (error) {
    console.error("❌ Erreur lors de la création des utilisateurs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();

