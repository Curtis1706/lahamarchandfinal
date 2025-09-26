const { PrismaClient } = require('@prisma/client');

async function getRealIds() {
  console.log("🔍 Récupération des IDs réels");
  console.log("=============================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    console.log("\n📚 Disciplines disponibles:");
    const disciplines = await prisma.discipline.findMany({
      select: { id: true, name: true }
    });
    
    disciplines.forEach(d => {
      console.log(`   ${d.name}: ${d.id}`);
    });

    console.log("\n👨‍🎨 Concepteurs disponibles:");
    const concepteurs = await prisma.user.findMany({
      where: { role: "CONCEPTEUR" },
      select: { id: true, name: true, email: true }
    });
    
    concepteurs.forEach(c => {
      console.log(`   ${c.name} (${c.email}): ${c.id}`);
    });

    // Essayer de créer une œuvre avec les vrais IDs
    if (disciplines.length > 0 && concepteurs.length > 0) {
      console.log("\n🧪 Test de création d'œuvre avec IDs réels...");
      
      try {
        const testWork = await prisma.work.create({
          data: {
            title: "Test Œuvre Schema",
            description: "Description de test pour vérifier le nouveau champ",
            isbn: `TEST-${Date.now()}`,
            price: 0,
            tva: 0.18,
            stock: 0,
            minStock: 0,
            
            // Nouveaux champs à tester
            category: "test",
            targetAudience: "test",
            educationalObjectives: "Objectifs de test",
            contentType: "manuel",
            keywords: "test,schema,prisma",
            files: JSON.stringify([{ name: "test.pdf" }]),
            
            status: "DRAFT",
            
            // Relations avec IDs réels
            discipline: {
              connect: { id: disciplines[0].id }
            },
            concepteur: {
              connect: { id: concepteurs[0].id }
            }
          }
        });

        console.log("✅ Création réussie avec nouveaux champs !");
        console.log("   ID:", testWork.id);
        console.log("   Titre:", testWork.title);
        console.log("   Description:", testWork.description ? "✅ Présente" : "❌ Manquante");
        console.log("   Category:", testWork.category ? "✅ Présente" : "❌ Manquante");
        console.log("   ContentType:", testWork.contentType ? "✅ Présent" : "❌ Manquant");
        console.log("   Keywords:", testWork.keywords ? "✅ Présents" : "❌ Manquants");

        // Nettoyer - supprimer l'œuvre de test
        await prisma.work.delete({ where: { id: testWork.id } });
        console.log("✅ Œuvre de test supprimée");

      } catch (createError) {
        console.error("❌ Erreur lors de la création de test:", createError.message);
        
        if (createError.message.includes("Unknown argument")) {
          console.log("\n🔧 SOLUTION REQUISE:");
          console.log("   Le client Prisma doit être régénéré");
          console.log("   1. Arrêter le serveur de développement");
          console.log("   2. Supprimer: node_modules\\.prisma\\");
          console.log("   3. Exécuter: npx prisma generate --force");
          console.log("   4. Redémarrer: npm run dev");
        }
      }
    }

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion");
  }
}

getRealIds().catch(console.error);
