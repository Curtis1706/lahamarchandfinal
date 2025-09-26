const { PrismaClient } = require('@prisma/client');

async function testWorkSchema() {
  console.log("🔍 Test du schéma Work - Nouveaux champs");
  console.log("=========================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    console.log("\n1. 📊 Test de connexion à la base de données...");
    console.log("✅ Connexion réussie !");

    console.log("\n2. 🔍 Vérification de la structure de la table Work...");
    
    // Essayer de créer une œuvre de test avec les nouveaux champs
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
          
          // Relations obligatoires
          discipline: {
            connect: { id: "cmg0o6k0c0000ulwk45yv7vpw" } // ID discipline existante
          },
          concepteur: {
            connect: { id: "cmfydsri0000oul9wjit7tmxr" } // ID concepteur existant
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
        console.log("\n🔧 DIAGNOSTIC:");
        console.log("   Le client Prisma n'a pas été régénéré avec les nouveaux champs");
        console.log("   Solutions:");
        console.log("   1. Arrêter le serveur");
        console.log("   2. Supprimer le dossier node_modules\\.prisma");
        console.log("   3. Exécuter: npx prisma generate");
        console.log("   4. Redémarrer le serveur");
      }
    }

    console.log("\n3. 📋 Vérification des disciplines et concepteurs...");
    
    const disciplineCount = await prisma.discipline.count();
    const concepteurCount = await prisma.user.count({ where: { role: "CONCEPTEUR" } });
    
    console.log(`✅ ${disciplineCount} discipline(s) disponible(s)`);
    console.log(`✅ ${concepteurCount} concepteur(s) disponible(s)`);

    if (disciplineCount === 0) {
      console.log("⚠️ Aucune discipline - créer des disciplines de test");
    }
    
    if (concepteurCount === 0) {
      console.log("⚠️ Aucun concepteur - créer des comptes concepteurs");
    }

  } catch (error) {
    console.error("❌ Erreur générale:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

testWorkSchema().catch(console.error);
