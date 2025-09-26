// Script pour créer un utilisateur de test avec mot de passe hashé
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🚀 Création d'un utilisateur de test avec mot de passe hashé");
    console.log("=" .repeat(50));

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = {
      name: "Auteur Test Interface",
      email: "auteur.interface@test.com",
      phone: "+22912345678",
      password: hashedPassword,
      role: "AUTEUR",
      status: "ACTIVE"
    };

    console.log("📝 Création de l'utilisateur...");

    const user = await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: testUser
    });

    console.log("✅ Utilisateur créé:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    console.log("\n🔐 Informations de connexion:");
    console.log("Email:", user.email);
    console.log("Mot de passe: password123");

    console.log("\n" + "=" .repeat(50));
    console.log("🏁 Utilisateur de test créé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();


