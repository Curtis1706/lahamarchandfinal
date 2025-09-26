const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAuthorAccount() {
  console.log("✍️ Création d'un compte auteur de test");
  console.log("======================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Récupérer une discipline par défaut
    const defaultDiscipline = await prisma.discipline.findFirst();
    console.log(`📚 Discipline par défaut: ${defaultDiscipline?.name || 'Aucune'}`);

    const authorData = {
      name: "Gislain Auteur",
      email: "gislain@gmail.com",
      phone: "96005482",
      password: await bcrypt.hash('password123', 10),
      role: "AUTEUR",
      status: "APPROVED", // Directement approuvé
      disciplineId: defaultDiscipline?.id || null
    };

    console.log("\n📝 Création du compte auteur...");
    console.log(`   Nom: ${authorData.name}`);
    console.log(`   Email: ${authorData.email}`);
    console.log(`   Téléphone: ${authorData.phone}`);
    console.log(`   Rôle: ${authorData.role}`);

    // Vérifier si le compte existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: authorData.email }
    });

    if (existingUser) {
      console.log("⚠️ Un compte avec cet email existe déjà:");
      console.log(`   Nom: ${existingUser.name}`);
      console.log(`   Rôle: ${existingUser.role}`);
      console.log(`   Statut: ${existingUser.status}`);
      
      if (existingUser.role !== "AUTEUR") {
        console.log("\n🔄 Mise à jour du rôle vers AUTEUR...");
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "AUTEUR", status: "APPROVED" }
        });
        console.log("✅ Rôle mis à jour avec succès !");
      }
      
      console.log("\n🔑 Informations de connexion:");
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Mot de passe: password123`);
      
      return;
    }

    const newUser = await prisma.user.create({
      data: authorData
    });

    console.log("✅ Compte auteur créé avec succès !");
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Nom: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Rôle: ${newUser.role}`);
    console.log(`   Statut: ${newUser.status}`);

    console.log("\n🔑 INFORMATIONS DE CONNEXION:");
    console.log("==============================");
    console.log(`📧 Email: ${newUser.email}`);
    console.log(`🔐 Mot de passe: password123`);

    console.log("\n🧪 TESTS À EFFECTUER:");
    console.log("======================");
    console.log("1. Se connecter avec les identifiants ci-dessus");
    console.log("2. Aller sur /dashboard/auteur");
    console.log("3. Créer une nouvelle œuvre");
    console.log("4. Sélectionner un projet validé (si disponible)");
    console.log("5. Soumettre l'œuvre pour validation PDG");

  } catch (error) {
    console.error("❌ Erreur lors de la création du compte:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

createAuthorAccount().catch(console.error);
