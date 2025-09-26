// Script pour tester le workflow de validation des œuvres
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWorkflowValidation() {
  try {
    console.log("🚀 Test du workflow de validation des œuvres");
    console.log("=" .repeat(50));

    // 1. Récupérer un auteur existant
    const auteur = await prisma.user.findFirst({
      where: { role: 'AUTEUR' }
    });

    if (!auteur) {
      console.log("❌ Aucun auteur trouvé");
      return;
    }

    console.log(`✅ Auteur: ${auteur.name} (${auteur.email})`);

    // 2. Récupérer une discipline
    const discipline = await prisma.discipline.findFirst();
    if (!discipline) {
      console.log("❌ Aucune discipline trouvée");
      return;
    }

    console.log(`✅ Discipline: ${discipline.name}`);

    // 3. Test 1: Créer une œuvre en brouillon
    console.log("\n📝 Test 1: Création d'une œuvre en brouillon");
    const draftWork = await prisma.work.create({
      data: {
        title: "Test Brouillon - " + new Date().toISOString(),
        isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        price: 15000,
        stock: 100,
        minStock: 10,
        maxStock: 1000,
        disciplineId: discipline.id,
        authorId: auteur.id,
        status: 'DRAFT'
      },
      include: {
        author: { select: { name: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log("✅ Brouillon créé:", {
      id: draftWork.id,
      title: draftWork.title,
      status: draftWork.status
    });

    // 4. Test 2: Soumettre pour validation
    console.log("\n📤 Test 2: Soumission pour validation");
    const submittedWork = await prisma.work.update({
      where: { id: draftWork.id },
      data: { 
        status: 'PENDING',
        updatedAt: new Date()
      },
      include: {
        author: { select: { name: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log("✅ Œuvre soumise:", {
      id: submittedWork.id,
      title: submittedWork.title,
      status: submittedWork.status
    });

    // 5. Test 3: Validation par le PDG (accepter)
    console.log("\n✅ Test 3: Validation par le PDG (acceptation)");
    const pdg = await prisma.user.findFirst({
      where: { role: 'PDG' }
    });

    if (pdg) {
      const approvedWork = await prisma.work.update({
        where: { id: submittedWork.id },
        data: { 
          status: 'PUBLISHED',
          publishedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          author: { select: { name: true } },
          discipline: { select: { name: true } }
        }
      });

      console.log("✅ Œuvre validée:", {
        id: approvedWork.id,
        title: approvedWork.title,
        status: approvedWork.status
      });

      // Créer une notification pour l'auteur
      await prisma.notification.create({
        data: {
          userId: auteur.id,
          title: "Œuvre validée",
          message: `Votre œuvre "${approvedWork.title}" a été validée et publiée par le PDG.`,
          type: "WORK_APPROVED",
          data: JSON.stringify({
            workId: approvedWork.id,
            workTitle: approvedWork.title,
            status: approvedWork.status
          })
        }
      });

      console.log("✅ Notification créée pour l'auteur");
    }

    // 6. Test 4: Créer une autre œuvre et la refuser
    console.log("\n❌ Test 4: Création et refus d'une œuvre");
    const rejectedWork = await prisma.work.create({
      data: {
        title: "Test Refusée - " + new Date().toISOString(),
        isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        price: 15000,
        stock: 100,
        minStock: 10,
        maxStock: 1000,
        disciplineId: discipline.id,
        authorId: auteur.id,
        status: 'REJECTED'
      },
      include: {
        author: { select: { name: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log("✅ Œuvre refusée:", {
      id: rejectedWork.id,
      title: rejectedWork.title,
      status: rejectedWork.status
    });

    // Créer une notification pour l'auteur
    await prisma.notification.create({
      data: {
        userId: auteur.id,
        title: "Œuvre refusée",
        message: `Votre œuvre "${rejectedWork.title}" a été refusée par le PDG. Vous pouvez la modifier et la resoumettre.`,
        type: "WORK_REJECTED",
        data: JSON.stringify({
          workId: rejectedWork.id,
          workTitle: rejectedWork.title,
          status: rejectedWork.status
        })
      }
    });

    console.log("✅ Notification créée pour l'auteur");

    console.log("\n" + "=" .repeat(50));
    console.log("🏁 Workflow de validation testé avec succès !");
    console.log("\n📊 Résumé des statuts:");
    console.log("- DRAFT: Brouillon (peut être modifié)");
    console.log("- PENDING: En attente de validation");
    console.log("- PUBLISHED: Validée et publiée");
    console.log("- REJECTED: Refusée (peut être modifiée)");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflowValidation();


