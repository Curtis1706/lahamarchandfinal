const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testUserCreationPrisma() {
  console.log("🚀 Test de création d'utilisateur avec Prisma");
  console.log("=" .repeat(50));

  try {
    // Test 1: Création d'un concepteur
    console.log("\n📝 Test 1: Création d'un concepteur");
    
    const hashedPassword = await bcrypt.hash("password123", 12);
    
    const concepteur = await prisma.user.create({
      data: {
        name: "Jean Concepteur",
        email: "jean.concepteur@test.com",
        phone: "+229 40 76 76 76",
        password: hashedPassword,
        role: "CONCEPTEUR",
        status: "PENDING",
        discipline: {
          connect: { id: "cmfu9p18l0001ul7o4a8t1mia" } // Histoire
        }
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Concepteur créé:`, {
      id: concepteur.id,
      name: concepteur.name,
      email: concepteur.email,
      role: concepteur.role,
      status: concepteur.status,
      discipline: concepteur.discipline?.name
    });

    // Test 2: Création d'un partenaire
    console.log("\n📝 Test 2: Création d'un partenaire");
    
    const partenaire = await prisma.user.create({
      data: {
        name: "Marie Partenaire",
        email: "marie.partenaire@test.com",
        phone: "+229 40 76 76 77",
        password: hashedPassword,
        role: "PARTENAIRE",
        status: "PENDING"
      }
    });

    console.log(`✅ Partenaire créé:`, {
      id: partenaire.id,
      name: partenaire.name,
      email: partenaire.email,
      role: partenaire.role,
      status: partenaire.status
    });

    // Test 3: Récupération des utilisateurs en attente
    console.log("\n📝 Test 3: Récupération des utilisateurs en attente");
    
    const pendingUsers = await prisma.user.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${pendingUsers.length} utilisateurs en attente:`);
    pendingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.discipline?.name || 'N/A'}`);
    });

    // Test 4: Validation d'un utilisateur (simulation)
    console.log("\n📝 Test 4: Validation d'un concepteur");
    
    const validatedConcepteur = await prisma.user.update({
      where: { id: concepteur.id },
      data: { status: "ACTIVE" }
    });

    console.log(`✅ Concepteur validé:`, {
      id: validatedConcepteur.id,
      name: validatedConcepteur.name,
      status: validatedConcepteur.status
    });

    // Test 5: Création de notifications
    console.log("\n📝 Test 5: Création de notifications");
    
    // Notification pour le concepteur
    const notification = await prisma.notification.create({
      data: {
        userId: concepteur.id,
        title: "Compte approuvé",
        message: "Félicitations ! Votre compte concepteur a été approuvé par l'administrateur.",
        type: "USER_ACCOUNT_APPROVED",
        data: JSON.stringify({
          userId: concepteur.id,
          userRole: "CONCEPTEUR",
          status: "ACTIVE"
        })
      }
    });

    console.log(`✅ Notification créée:`, {
      id: notification.id,
      title: notification.title,
      userId: notification.userId
    });

    console.log("\n" + "=".repeat(50));
    console.log("🏁 Test de création d'utilisateurs terminé avec succès !");
    console.log("\n📊 Résumé:");
    console.log("- 1 Concepteur créé et validé");
    console.log("- 1 Partenaire créé (en attente)");
    console.log("- Notifications créées");
    console.log("- Workflow de validation fonctionnel");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testUserCreationPrisma()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




