const { execSync } = require('child_process');

console.log("🔄 Migration: Ajout du modèle Message");
console.log("=====================================");

try {
  console.log("1. 📋 Génération de la migration Prisma...");
  execSync('npx prisma migrate dev --name add-messages-model', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log("\n2. 🔄 Génération du client Prisma...");
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log("\n✅ Migration terminée avec succès !");
  console.log("\n📊 Nouveau modèle ajouté:");
  console.log("   📧 Message");
  console.log("      • id, subject, content, type");
  console.log("      • read, readAt");
  console.log("      • senderId → User (SentMessages)");
  console.log("      • recipientId → User (ReceivedMessages)");
  console.log("      • createdAt, updatedAt");

  console.log("\n🔗 Relations ajoutées dans User:");
  console.log("   • sentMessages: Message[]");
  console.log("   • receivedMessages: Message[]");

  console.log("\n🚀 Prêt à utiliser la messagerie interne !");

} catch (error) {
  console.error("❌ Erreur lors de la migration:", error.message);
  console.log("\n💡 Solutions possibles:");
  console.log("1. Vérifier que DATABASE_URL est défini");
  console.log("2. S'assurer que la base de données est accessible");
  console.log("3. Exécuter manuellement: npx prisma migrate dev --name add-messages-model");
}
