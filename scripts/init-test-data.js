// Script pour initialiser la base de données avec des données de test
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initTestData() {
  try {
    console.log("🚀 Initialisation des données de test...");

    // Créer des disciplines de test
    const disciplines = [
      "Français",
      "Mathématiques",
      "Histoire",
      "Géographie",
      "Sciences",
      "Littérature",
      "Philosophie",
      "Économie",
      "Informatique",
      "Arts"
    ];

    console.log("📚 Création des disciplines...");
    for (const disciplineName of disciplines) {
      try {
        const discipline = await prisma.discipline.upsert({
          where: { name: disciplineName },
          update: {},
          create: { name: disciplineName }
        });
        console.log(`✅ Discipline créée: ${discipline.name}`);
      } catch (error) {
        console.log(`⚠️ Discipline ${disciplineName} existe déjà ou erreur:`, error.message);
      }
    }

    // Créer un utilisateur auteur de test
    console.log("👤 Création d'un auteur de test...");
    try {
      const auteur = await prisma.user.upsert({
        where: { email: "auteur.test@example.com" },
        update: {},
        create: {
          name: "Auteur Test",
          email: "auteur.test@example.com",
          phone: "+22912345678",
          password: "password123", // En production, il faudrait hasher le mot de passe
          role: "AUTEUR",
          status: "ACTIVE"
        }
      });
      console.log(`✅ Auteur créé: ${auteur.name} (${auteur.email})`);
    } catch (error) {
      console.log(`⚠️ Auteur existe déjà ou erreur:`, error.message);
    }

    // Créer un utilisateur PDG de test
    console.log("👑 Création d'un PDG de test...");
    try {
      const pdg = await prisma.user.upsert({
        where: { email: "pdg.test@example.com" },
        update: {},
        create: {
          name: "PDG Test",
          email: "pdg.test@example.com",
          phone: "+22987654321",
          password: "password123",
          role: "PDG",
          status: "ACTIVE"
        }
      });
      console.log(`✅ PDG créé: ${pdg.name} (${pdg.email})`);
    } catch (error) {
      console.log(`⚠️ PDG existe déjà ou erreur:`, error.message);
    }

    console.log("✅ Initialisation terminée !");

  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

initTestData();



