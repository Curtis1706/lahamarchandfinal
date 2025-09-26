const { PrismaClient } = require('@prisma/client');

async function listTestAccounts() {
  console.log("👥 Comptes de test disponibles");
  console.log("==============================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    const allUsers = await prisma.user.findMany({
      where: {
        role: { in: ["PDG", "CONCEPTEUR", "AUTEUR"] }
      },
      select: { name: true, email: true, role: true, status: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });

    console.log(`\n📊 ${allUsers.length} compte(s) trouvé(s):`);

    const groupedUsers = {
      PDG: [],
      CONCEPTEUR: [],
      AUTEUR: []
    };

    allUsers.forEach(user => {
      if (groupedUsers[user.role]) {
        groupedUsers[user.role].push(user);
      }
    });

    Object.entries(groupedUsers).forEach(([role, users]) => {
      if (users.length > 0) {
        console.log(`\n👔 ${role} (${users.length}):`);
        users.forEach(user => {
          const statusIcon = user.status === 'APPROVED' ? '✅' : '⏳';
          console.log(`   ${statusIcon} ${user.name}`);
          console.log(`      📧 ${user.email}`);
          console.log(`      🔑 password123 (par défaut)`);
        });
      }
    });

    console.log("\n🧪 TESTS RECOMMANDÉS:");
    console.log("======================");

    console.log("\n1. 👔 Test PDG:");
    console.log("   • Email: pdg@lahamarchand.com");
    console.log("   • Tester validation projets et œuvres");

    console.log("\n2. 👨‍🎨 Test Concepteur:");
    console.log("   • Email: alphonse.concepteur@lahamarchand.com");
    console.log("   • Tester création de projets uniquement");

    console.log("\n3. ✍️ Test Auteur:");
    console.log("   • Email: emilie.auteure@lahamarchand.com");
    console.log("   • Tester création d'œuvres avec projets validés");

    console.log("\n🎯 WORKFLOW À TESTER:");
    console.log("======================");

    console.log("\n   📋 Étape 1 - Concepteur:");
    console.log("      1. Se connecter comme concepteur");
    console.log("      2. Créer un nouveau projet");
    console.log("      3. Soumettre le projet au PDG");

    console.log("\n   👔 Étape 2 - PDG:");
    console.log("      1. Se connecter comme PDG");
    console.log("      2. Valider le projet du concepteur");
    console.log("      3. Vérifier notifications");

    console.log("\n   ✍️ Étape 3 - Auteur:");
    console.log("      1. Se connecter comme auteur");
    console.log("      2. Créer une œuvre");
    console.log("      3. Rattacher au projet validé");
    console.log("      4. Soumettre l'œuvre");

    console.log("\n   👔 Étape 4 - PDG:");
    console.log("      1. Valider l'œuvre de l'auteur");
    console.log("      2. Vérifier publication");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

listTestAccounts().catch(console.error);
