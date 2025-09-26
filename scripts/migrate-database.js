const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function migrateDatabase() {
  console.log("🔄 Démarrage de la migration de la base de données...");
  
  try {
    // 1. Générer le client Prisma
    console.log("📦 Génération du client Prisma...");
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Appliquer les migrations
    console.log("🗄️ Application des migrations...");
    execSync('npx prisma migrate dev --name "add-project-works-relation"', { stdio: 'inherit' });
    
    // 3. Vérifier la connexion
    console.log("🔍 Vérification de la connexion à la base de données...");
    const prisma = new PrismaClient();
    
    // Test de connexion
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie");
    
    // Vérifier que les modèles existent
    const projectCount = await prisma.project.count();
    const workCount = await prisma.work.count();
    const userCount = await prisma.user.count();
    
    console.log("📊 Statistiques de la base de données:");
    console.log(`   - Projets: ${projectCount}`);
    console.log(`   - Œuvres: ${workCount}`);
    console.log(`   - Utilisateurs: ${userCount}`);
    
    // Test de la relation Project-Work
    console.log("🔗 Test de la relation Project-Work...");
    try {
      const projectsWithWorks = await prisma.project.findMany({
        include: {
          works: true
        },
        take: 1
      });
      console.log("✅ Relation Project-Work fonctionnelle");
    } catch (error) {
      console.log("⚠️ Relation Project-Work non disponible:", error.message);
    }
    
    await prisma.$disconnect();
    
    console.log("\n🎉 Migration terminée avec succès!");
    console.log("💡 Vous pouvez maintenant utiliser la page de gestion des projets.");
    
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log("\n💡 Solution:");
      console.log("1. Créez un fichier .env dans le dossier backend");
      console.log("2. Ajoutez: DATABASE_URL='file:./dev.db'");
      console.log("3. Relancez ce script");
    }
    
    process.exit(1);
  }
}

migrateDatabase();
