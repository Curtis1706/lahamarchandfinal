const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPDGUser() {
  console.log("🔧 Création d'un utilisateur PDG");
  console.log("=================================");

  try {
    // Vérifier si un PDG existe déjà
    const existingPDG = await prisma.user.findFirst({
      where: { role: 'PDG' }
    });

    if (existingPDG) {
      console.log("⚠️ Un utilisateur PDG existe déjà:");
      console.log(`   • Nom: ${existingPDG.name}`);
      console.log(`   • Email: ${existingPDG.email}`);
      console.log(`   • Statut: ${existingPDG.status}`);
      console.log(`   • Créé le: ${existingPDG.createdAt}`);
      return;
    }

    // Données du PDG
    const pdgData = {
      name: "PDG LAHA",
      email: "pdg@laha.gabon",
      phone: "+229 40 76 76 76",
      password: "password123",
      role: "PDG"
    };

    console.log("🔍 Création de l'utilisateur PDG...");
    console.log(`   • Nom: ${pdgData.name}`);
    console.log(`   • Email: ${pdgData.email}`);
    console.log(`   • Téléphone: ${pdgData.phone}`);
    console.log(`   • Rôle: ${pdgData.role}`);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(pdgData.password, 12);
    console.log("✅ Mot de passe hashé");

    // Créer l'utilisateur PDG
    const pdgUser = await prisma.user.create({
      data: {
        name: pdgData.name,
        email: pdgData.email,
        phone: pdgData.phone,
        password: hashedPassword,
        role: pdgData.role,
        status: "ACTIVE"
      }
    });

    console.log("✅ Utilisateur PDG créé avec succès:");
    console.log(`   • ID: ${pdgUser.id}`);
    console.log(`   • Nom: ${pdgUser.name}`);
    console.log(`   • Email: ${pdgUser.email}`);
    console.log(`   • Téléphone: ${pdgUser.phone}`);
    console.log(`   • Rôle: ${pdgUser.role}`);
    console.log(`   • Statut: ${pdgUser.status}`);
    console.log(`   • Créé le: ${pdgUser.createdAt}`);

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "USER_CREATE",
        userId: pdgUser.id,
        performedBy: pdgUser.id, // Auto-création
        details: `Utilisateur PDG ${pdgUser.name} créé lors de l'initialisation du système`,
        metadata: JSON.stringify({
          userId: pdgUser.id,
          userName: pdgUser.name,
          userEmail: pdgUser.email,
          userRole: pdgUser.role,
          status: pdgUser.status,
          createdBy: "SYSTEM_INIT"
        })
      }
    });
    console.log("✅ Log d'audit créé");

    console.log("\n🔐 INFORMATIONS DE CONNEXION:");
    console.log("=============================");
    console.log(`   • Email: ${pdgData.email}`);
    console.log(`   • Mot de passe: ${pdgData.password}`);
    console.log(`   • URL de connexion: http://localhost:3000/auth/login`);

    console.log("\n📊 FONCTIONNALITÉS DISPONIBLES:");
    console.log("===============================");
    console.log("   • Gestion des utilisateurs");
    console.log("   • Validation des projets");
    console.log("   • Validation des œuvres");
    console.log("   • Gestion des disciplines");
    console.log("   • Audit et historique");
    console.log("   • Notifications système");

    console.log("\n🎯 PROCHAINES ÉTAPES:");
    console.log("=====================");
    console.log("   1. Se connecter avec les identifiants ci-dessus");
    console.log("   2. Accéder au dashboard PDG");
    console.log("   3. Créer d'autres utilisateurs si nécessaire");
    console.log("   4. Configurer les disciplines");
    console.log("   5. Valider les projets et œuvres");

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur PDG:", error);
    console.error("   • Message:", error.message);
    console.error("   • Code:", error.code);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la fonction
createPDGUser();
