const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestWorkPending() {
  try {
    console.log("🔍 Création d'une œuvre de test avec statut PENDING...");

    // Trouver un concepteur existant
    const concepteur = await prisma.user.findFirst({
      where: { role: "CONCEPTEUR" }
    });

    if (!concepteur) {
      console.error("❌ Aucun concepteur trouvé. Créez d'abord un utilisateur concepteur.");
      return;
    }

    console.log("🔍 Concepteur trouvé:", concepteur.name);

    // Trouver une discipline existante
    const discipline = await prisma.discipline.findFirst();

    if (!discipline) {
      console.error("❌ Aucune discipline trouvée. Créez d'abord des disciplines.");
      return;
    }

    console.log("🔍 Discipline trouvée:", discipline.name);

    // Générer un ISBN unique
    const isbn = `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Créer l'œuvre avec le statut PENDING
    const work = await prisma.work.create({
      data: {
        title: `Test Œuvre - ${new Date().toISOString()}`,
        isbn: isbn,
        price: 1500.00,
        stock: 100,
        minStock: 10,
        maxStock: 500,
        status: "PENDING", // Statut en attente de validation
        discipline: {
          connect: { id: discipline.id }
        },
        concepteur: {
          connect: { id: concepteur.id }
        }
      },
      include: {
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
      concepteur: work.concepteur.name,
      discipline: work.discipline.name,
      price: work.price
    });

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: "PDG" }
      });

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: "Nouvelle œuvre soumise",
            message: `Le concepteur ${work.concepteur.name} a soumis une nouvelle œuvre "${work.title}" pour validation.`,
            type: "WORK_SUBMITTED_FOR_VALIDATION",
            data: JSON.stringify({
              workId: work.id,
              workTitle: work.title,
              concepteurId: work.concepteur.id,
              concepteurName: work.concepteur.name,
              discipline: work.discipline.name,
              isbn: work.isbn
            })
          }
        });
        console.log("✅ Notification créée pour le PDG");
      }
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    console.log("🎉 Test terminé avec succès ! L'œuvre devrait maintenant apparaître dans la page de validation des œuvres du PDG.");

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'œuvre:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorkPending();

