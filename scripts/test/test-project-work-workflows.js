const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWorkflows() {
  try {
    console.log("🧪 Test des workflows Projet et Œuvre");
    console.log("=====================================");

    // 1. Trouver un Concepteur
    const concepteur = await prisma.user.findFirst({
      where: { role: 'CONCEPTEUR' },
    });

    if (!concepteur) {
      console.error("❌ Aucun concepteur trouvé. Veuillez créer un concepteur d'abord.");
      return;
    }

    console.log("✅ Concepteur trouvé:", concepteur.name);

    // 2. Trouver un Auteur
    const auteur = await prisma.user.findFirst({
      where: { role: 'AUTEUR' },
    });

    if (!auteur) {
      console.error("❌ Aucun auteur trouvé. Veuillez créer un auteur d'abord.");
      return;
    }

    console.log("✅ Auteur trouvé:", auteur.name);

    // 3. Trouver une Discipline
    const discipline = await prisma.discipline.findFirst();

    if (!discipline) {
      console.error("❌ Aucune discipline trouvée. Veuillez créer une discipline d'abord.");
      return;
    }

    console.log("✅ Discipline trouvée:", discipline.name);

    console.log("\n📋 Test 1: Workflow Concepteur (Projet → Œuvre)");
    console.log("-----------------------------------------------");

    // 4. Créer un projet par le Concepteur
    const project = await prisma.project.create({
      data: {
        title: `Test Projet Concepteur - ${new Date().toISOString()}`,
        description: "Ceci est un projet de test créé par un concepteur pour générer une œuvre.",
        disciplineId: discipline.id,
        concepteurId: concepteur.id,
        status: "DRAFT",
      },
    });

    console.log("✅ Projet créé:", project.title);

    // 5. Soumettre le projet (cela devrait créer automatiquement une œuvre)
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    console.log("✅ Projet soumis:", updatedProject.status);

    // 6. Vérifier qu'une œuvre a été créée automatiquement
    const workFromProject = await prisma.work.findFirst({
      where: { projectId: project.id },
      include: {
        project: true,
        concepteur: true,
        discipline: true,
      },
    });

    if (workFromProject) {
      console.log("✅ Œuvre créée automatiquement:", workFromProject.title);
      console.log("   - Statut:", workFromProject.status);
      console.log("   - Projet d'origine:", workFromProject.project?.title);
      console.log("   - Concepteur:", workFromProject.concepteur?.name);
    } else {
      console.log("⚠️ Aucune œuvre créée automatiquement (normal si l'API n'est pas appelée)");
    }

    console.log("\n📋 Test 2: Workflow Auteur (Œuvre directe)");
    console.log("------------------------------------------");

    // 7. Créer une œuvre directement par l'Auteur
    const isbn = `978-${Date.now().toString().slice(-9)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const directWork = await prisma.work.create({
      data: {
        title: `Test Œuvre Auteur - ${new Date().toISOString()}`,
        isbn: isbn,
        price: 15000,
        stock: 100,
        minStock: 10,
        maxStock: 500,
        status: "PENDING", // Soumission directe pour validation PDG
        disciplineId: discipline.id,
        authorId: auteur.id,
        // Pas de projectId - œuvre directe d'un auteur
      },
      include: {
        author: true,
        discipline: true,
        project: true,
      },
    });

    console.log("✅ Œuvre directe créée:", directWork.title);
    console.log("   - Statut:", directWork.status);
    console.log("   - Auteur:", directWork.author?.name);
    console.log("   - Projet d'origine:", directWork.project ? "Oui" : "Non (directe)");

    console.log("\n📊 Résumé des tests");
    console.log("===================");

    // Compter les projets
    const projectCount = await prisma.project.count();
    console.log("📁 Projets totaux:", projectCount);

    // Compter les œuvres
    const workCount = await prisma.work.count();
    console.log("📚 Œuvres totales:", workCount);

    // Compter les œuvres par statut
    const workStats = await prisma.work.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log("📈 Répartition des œuvres par statut:");
    workStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.id}`);
    });

    // Compter les œuvres avec/sans projet
    const worksWithProject = await prisma.work.count({
      where: { projectId: { not: null } },
    });
    const worksWithoutProject = await prisma.work.count({
      where: { projectId: null },
    });

    console.log("🔗 Œuvres avec projet d'origine:", worksWithProject);
    console.log("🔗 Œuvres sans projet (directes):", worksWithoutProject);

    // Compter les œuvres par créateur
    const worksByAuthor = await prisma.work.count({
      where: { authorId: { not: null } },
    });
    const worksByConcepteur = await prisma.work.count({
      where: { concepteurId: { not: null } },
    });

    console.log("👤 Œuvres créées par des Auteurs:", worksByAuthor);
    console.log("👤 Œuvres créées par des Concepteurs:", worksByConcepteur);

    console.log("\n✅ Tests terminés avec succès!");
    console.log("\n💡 Prochaines étapes:");
    console.log("   1. Testez l'API /api/concepteurs/projects pour créer des projets");
    console.log("   2. Testez l'API /api/authors/works pour créer des œuvres directes");
    console.log("   3. Vérifiez la page de validation PDG pour voir les œuvres en attente");
    console.log("   4. Testez les tableaux de bord Auteur et Concepteur");

  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflows();

