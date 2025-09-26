// Script pour tester la création d'œuvres avec des données réelles de la base
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWorkCreation() {
  try {
    console.log("🚀 Test de création d'œuvres avec des données réelles");
    console.log("=" .repeat(50));

    // 1. Récupérer un auteur existant
    const auteurs = await prisma.user.findMany({
      where: { role: 'AUTEUR' },
      take: 1
    });

    if (auteurs.length === 0) {
      console.log("❌ Aucun auteur trouvé");
      return;
    }

    const auteur = auteurs[0];
    console.log(`✅ Auteur sélectionné: ${auteur.name} (${auteur.email})`);

    // 2. Récupérer une discipline existante
    const disciplines = await prisma.discipline.findMany({
      take: 1
    });

    if (disciplines.length === 0) {
      console.log("❌ Aucune discipline trouvée");
      return;
    }

    const discipline = disciplines[0];
    console.log(`✅ Discipline sélectionnée: ${discipline.name}`);

    // 3. Tester la création d'œuvre
    const testWork = {
      title: `Test de création - ${new Date().toISOString()}`,
      isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      price: 15000,
      stock: 100,
      minStock: 10,
      maxStock: 1000,
      disciplineId: discipline.id,
      authorId: auteur.id,
      status: 'PUBLISHED'
    };

    console.log("\n📝 Données de test:", testWork);

    // 4. Créer l'œuvre
    console.log("\n🔄 Création de l'œuvre...");
    const work = await prisma.work.create({
      data: testWork,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log("✅ Œuvre créée avec succès:", {
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      status: work.status,
      author: work.author.name,
      discipline: work.discipline.name
    });

    // 5. Créer un log d'audit
    console.log("\n📝 Création du log d'audit...");
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "WORK_CREATE",
        userId: auteur.id,
        performedBy: auteur.id,
        details: JSON.stringify({
          workId: work.id,
          workTitle: work.title,
          status: work.status,
          discipline: work.discipline.name,
          isbn: work.isbn
        })
      }
    });

    console.log("✅ Log d'audit créé:", auditLog.id);

    // 6. Créer une notification
    console.log("\n🔔 Création de la notification...");
    const notification = await prisma.notification.create({
      data: {
        userId: auteur.id,
        title: "Œuvre créée",
        message: `Votre œuvre "${work.title}" a été créée avec succès.`,
        type: "WORK_CREATED",
        data: JSON.stringify({
          workId: work.id,
          workTitle: work.title,
          status: work.status
        })
      }
    });

    console.log("✅ Notification créée:", notification.id);

    console.log("\n" + "=" .repeat(50));
    console.log("🏁 Test terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    if (error.code === 'P2002') {
      console.error("📝 Erreur: L'ISBN existe déjà");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testWorkCreation();


