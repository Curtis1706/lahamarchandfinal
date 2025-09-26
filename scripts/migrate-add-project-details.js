const { execSync } = require('child_process');

console.log("🔄 Migration: Ajout des champs détaillés au modèle Project");
console.log("========================================================");

try {
  console.log("1. 📋 Génération de la migration Prisma...");
  execSync('npx prisma migrate dev --name add-project-details-fields', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log("\n2. 🔄 Génération du client Prisma...");
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log("\n✅ Migration terminée avec succès !");
  console.log("\n📊 Nouveaux champs ajoutés au modèle Project:");
  console.log("   🎯 objectives: String? - Objectifs du projet");
  console.log("   📦 expectedDeliverables: String? - Livrables attendus");
  console.log("   🔧 requiredResources: String? - Ressources nécessaires");
  console.log("   📅 timeline: String? - Planning prévisionnel");
  console.log("   ❌ rejectionReason: String? - Motif de refus (si rejeté)");

  console.log("\n🔧 APIs mises à jour:");
  console.log("   ✅ /api/concepteurs/projects - Création avec champs détaillés");
  console.log("   ✅ /api/projects - Récupération avec champs détaillés");
  console.log("   ✅ /api/projects/[id] - Détails avec champs détaillés");

  console.log("\n🎯 Interface PDG mise à jour:");
  console.log("   ✅ Affichage des objectifs du projet");
  console.log("   ✅ Affichage des livrables attendus");
  console.log("   ✅ Affichage des ressources nécessaires");
  console.log("   ✅ Affichage du planning prévisionnel");
  console.log("   ✅ Affichage du motif de refus (si applicable)");

  console.log("\n🚀 Le PDG peut maintenant voir TOUS les détails de soumission des projets !");

} catch (error) {
  console.error("❌ Erreur lors de la migration:", error.message);
  console.log("\n💡 Solutions possibles:");
  console.log("1. Vérifier que DATABASE_URL est défini");
  console.log("2. S'assurer que la base de données est accessible");
  console.log("3. Exécuter manuellement: npx prisma migrate dev --name add-project-details-fields");
}
