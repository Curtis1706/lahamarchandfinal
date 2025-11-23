const { PrismaClient } = require('@prisma/client');

async function checkValidatedProjects() {
  console.log("🔍 Vérification des projets validés");
  console.log("===================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Vérifier tous les projets
    const allProjects = await prisma.project.findMany({
      include: {
        concepteur: {
          select: { id: true, name: true, email: true }
        },
        discipline: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 Total des projets: ${allProjects.length}`);

    if (allProjects.length === 0) {
      console.log("\n❌ Aucun projet trouvé en base de données");
      console.log("\n💡 Solution:");
      console.log("   1. Créer un compte concepteur");
      console.log("   2. Soumettre un projet");
      console.log("   3. Valider le projet en tant que PDG");
      return;
    }

    // Grouper par statut
    const projectsByStatus = allProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📈 Répartition par statut:");
    Object.entries(projectsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} projet(s)`);
    });

    // Afficher les projets validés
    const validatedProjects = allProjects.filter(p => p.status === "ACCEPTED");
    
    console.log(`\n✅ Projets validés (ACCEPTED): ${validatedProjects.length}`);

    if (validatedProjects.length === 0) {
      console.log("\n⚠️ Aucun projet validé trouvé !");
      console.log("\n🔧 Actions nécessaires:");
      console.log("   1. Identifier les projets à valider");
      console.log("   2. Se connecter comme PDG");
      console.log("   3. Valider les projets dans l'interface PDG");
      
      // Afficher les projets en attente
      const pendingProjects = allProjects.filter(p => p.status === "SUBMITTED");
      if (pendingProjects.length > 0) {
        console.log(`\n📋 Projets en attente de validation (${pendingProjects.length}):`);
        pendingProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. "${project.title}"`);
          console.log(`      • Concepteur: ${project.concepteur?.name || "Non défini"}`);
          console.log(`      • Discipline: ${project.discipline?.name || "Non définie"}`);
          console.log(`      • Statut: ${project.status}`);
          console.log(`      • Créé le: ${project.createdAt.toLocaleDateString()}`);
        });
      }
    } else {
      console.log("\n🎯 Projets validés disponibles pour les auteurs:");
      validatedProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. "${project.title}"`);
        console.log(`      • Concepteur: ${project.concepteur?.name || "Non défini"}`);
        console.log(`      • Discipline: ${project.discipline?.name || "Non définie"}`);
        console.log(`      • ID: ${project.id}`);
        console.log(`      • Validé le: ${project.reviewedAt?.toLocaleDateString() || "Date inconnue"}`);
      });
    }

    // Vérifier l'API
    console.log("\n🔧 Test de l'API:");
    console.log("   URL: /api/projects?status=ACCEPTED");
    console.log("   Méthode: GET");
    console.log("   Réponse attendue: Liste des projets validés");

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

checkValidatedProjects().catch(console.error);
