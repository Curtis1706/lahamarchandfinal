const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestAccounts() {
  console.log("👥 Création des comptes de test");
  console.log("===============================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    console.log("\n1. 📊 Vérification des comptes existants...");
    
    const existingUsers = await prisma.user.findMany({
      select: { email: true, role: true, name: true }
    });
    
    console.log(`   ${existingUsers.length} compte(s) existant(s):`);
    existingUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.role}): ${user.email}`);
    });

    console.log("\n2. 👤 Création des comptes de test...");
    
    // Récupérer une discipline par défaut
    const defaultDiscipline = await prisma.discipline.findFirst();
    
    const testAccounts = [
      {
        name: "Marie Auteur",
        email: "marie.auteur@lahamarchand.com",
        role: "AUTEUR",
        disciplineId: defaultDiscipline?.id
      },
      {
        name: "Pierre Auteur",
        email: "pierre.auteur@lahamarchand.com", 
        role: "AUTEUR",
        disciplineId: defaultDiscipline?.id
      },
      {
        name: "Sophie Concepteur",
        email: "sophie.concepteur@lahamarchand.com",
        role: "CONCEPTEUR",
        disciplineId: defaultDiscipline?.id
      }
    ];

    const defaultPassword = await bcrypt.hash('password123', 10);

    for (const account of testAccounts) {
      try {
        // Vérifier si le compte existe déjà
        const existing = await prisma.user.findUnique({
          where: { email: account.email }
        });

        if (existing) {
          console.log(`   ⚠️ Compte déjà existant: ${account.email}`);
          continue;
        }

        const newUser = await prisma.user.create({
          data: {
            name: account.name,
            email: account.email,
            password: defaultPassword,
            role: account.role,
            status: "VALIDATED", // Directement validé
            disciplineId: account.disciplineId
          }
        });

        console.log(`   ✅ Créé: ${newUser.name} (${newUser.role})`);
        
      } catch (error) {
        console.error(`   ❌ Erreur création ${account.email}:`, error.message);
      }
    }

    console.log("\n3. 📊 Statistiques finales...");
    
    const roleStats = await Promise.all([
      prisma.user.count({ where: { role: "PDG" } }),
      prisma.user.count({ where: { role: "CONCEPTEUR" } }),
      prisma.user.count({ where: { role: "AUTEUR" } }),
      prisma.user.count({ where: { role: "REPRESENTANT" } }),
      prisma.user.count({ where: { role: "CLIENT" } })
    ]);

    console.log(`   👔 PDG: ${roleStats[0]}`);
    console.log(`   👨‍🎨 CONCEPTEUR: ${roleStats[1]}`);
    console.log(`   ✍️ AUTEUR: ${roleStats[2]}`);
    console.log(`   🤝 REPRESENTANT: ${roleStats[3]}`);
    console.log(`   👤 CLIENT: ${roleStats[4]}`);

    console.log("\n🎯 COMPTES DE TEST DISPONIBLES:");
    console.log("================================");

    const allUsers = await prisma.user.findMany({
      where: {
        status: "VALIDATED",
        role: { in: ["PDG", "CONCEPTEUR", "AUTEUR"] }
      },
      select: { name: true, email: true, role: true },
      orderBy: { role: 'asc' }
    });

    console.log("\n📋 Connexions disponibles (password123):");
    
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
        console.log(`\n   ${role}:`);
        users.forEach(user => {
          console.log(`      • ${user.name}: ${user.email}`);
        });
      }
    });

    console.log("\n🧪 TESTS À EFFECTUER:");
    console.log("======================");

    console.log("\n   👔 Test PDG:");
    console.log("      • Se connecter avec un compte PDG");
    console.log("      • Valider projets et œuvres");
    console.log("      • Vérifier notifications");

    console.log("\n   👨‍🎨 Test Concepteur:");
    console.log("      • Se connecter avec un compte CONCEPTEUR");
    console.log("      • Créer et soumettre des projets");
    console.log("      • Vérifier: pas d'option créer œuvre");

    console.log("\n   ✍️ Test Auteur:");
    console.log("      • Se connecter avec un compte AUTEUR");
    console.log("      • Créer des œuvres");
    console.log("      • Rattacher à des projets validés");

  } catch (error) {
    console.error("❌ Erreur lors de la création des comptes:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

createTestAccounts().catch(console.error);
