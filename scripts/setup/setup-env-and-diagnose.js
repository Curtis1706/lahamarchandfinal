const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration de l'environnement pour SQLite
process.env.DATABASE_URL = "file:./dev.db";

async function setupAndDiagnose() {
  try {
    console.log("🔧 Configuration de l'environnement et diagnostic");
    console.log("=================================================");

    // Vérifier que le fichier de base de données existe
    const dbPath = path.join(__dirname, '..', 'dev.db');
    const backendDbPath = path.join(__dirname, '..', 'backend', 'prisma', 'dev.db');
    
    console.log(`📁 Vérification des bases de données:`);
    console.log(`   - Racine: ${fs.existsSync(dbPath) ? '✅' : '❌'} ${dbPath}`);
    console.log(`   - Backend: ${fs.existsSync(backendDbPath) ? '✅' : '❌'} ${backendDbPath}`);

    // Utiliser la base de données qui existe
    let dbUrl;
    if (fs.existsSync(backendDbPath)) {
      dbUrl = "file:./backend/prisma/dev.db";
      process.env.DATABASE_URL = dbUrl;
      console.log(`✅ Utilisation de la base backend: ${dbUrl}`);
    } else if (fs.existsSync(dbPath)) {
      dbUrl = "file:./dev.db";
      process.env.DATABASE_URL = dbUrl;
      console.log(`✅ Utilisation de la base racine: ${dbUrl}`);
    } else {
      console.log(`❌ Aucune base de données trouvée!`);
      console.log(`💡 Créer une base de données avec: npx prisma db push`);
      return;
    }

    // Créer le client Prisma
    const prisma = new PrismaClient();

    console.log(`\n🔍 Diagnostic des représentants:`);
    
    // Vérifier la connexion
    await prisma.$connect();
    console.log(`✅ Connexion à la base de données réussie`);

    // Trouver tous les représentants
    const representatives = await prisma.user.findMany({
      where: { role: "REPRESENTANT" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    console.log(`\n📊 ${representatives.length} représentant(s) trouvé(s):`);
    representatives.forEach(rep => {
      console.log(`   • ${rep.name} (${rep.email}) - Créé le ${rep.createdAt.toLocaleDateString()}`);
    });

    // Pour chaque représentant, vérifier ses données
    for (const rep of representatives) {
      console.log(`\n🔍 Analyse pour ${rep.name}:`);
      
      // Commandes créées par le représentant
      const ordersCreated = await prisma.order.findMany({
        where: { userId: rep.id },
        include: {
          items: {
            include: {
              work: true
            }
          }
        }
      });

      console.log(`   📦 Commandes créées: ${ordersCreated.length}`);
      if (ordersCreated.length > 0) {
        ordersCreated.forEach(order => {
          console.log(`      - Commande ${order.id} (${order.status}) - ${order.createdAt.toLocaleDateString()}`);
          console.log(`        Items: ${order.items.length}`);
        });
      }

      // Partenaires associés au représentant
      const partners = await prisma.partner.findMany({
        where: { representantId: rep.id }
      });

      console.log(`   🤝 Partenaires associés: ${partners.length}`);
      if (partners.length > 0) {
        partners.forEach(partner => {
          console.log(`      - ${partner.name} (${partner.type})`);
        });
      }

      // Notifications reçues
      const notifications = await prisma.notification.findMany({
        where: { userId: rep.id }
      });

      console.log(`   🔔 Notifications: ${notifications.length}`);
    }

    // Vérifier s'il y a des commandes orphelines
    console.log(`\n🔍 Vérification des commandes orphelines...`);
    
    const allOrders = await prisma.order.findMany({
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    console.log(`   📦 Total des commandes dans le système: ${allOrders.length}`);
    
    const ordersByRole = {};
    allOrders.forEach(order => {
      const role = order.user.role;
      if (!ordersByRole[role]) ordersByRole[role] = 0;
      ordersByRole[role]++;
    });

    console.log(`   📊 Répartition par rôle:`);
    Object.entries(ordersByRole).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count} commandes`);
    });

    // Recommandations
    console.log(`\n💡 RECOMMANDATIONS:`);
    console.log(`===================`);
    
    const representativesWithData = representatives.filter(async rep => {
      const ordersCount = await prisma.order.count({ where: { userId: rep.id } });
      const partnersCount = await prisma.partner.count({ where: { representantId: rep.id } });
      const notificationsCount = await prisma.notification.count({ where: { userId: rep.id } });
      return ordersCount > 0 || partnersCount > 0 || notificationsCount > 0;
    });

    if (representativesWithData.length > 0) {
      console.log(`❌ Problème détecté: Des représentants ont des données associées`);
      console.log(`   → Solution: Exécuter le script de nettoyage`);
      console.log(`   → Commande: node scripts/clean-representative-data.js`);
    } else {
      console.log(`✅ Aucun problème détecté: Les représentants n'ont pas de données par défaut`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error.message);
    
    if (error.message.includes("Environment variable not found: DATABASE_URL")) {
      console.log(`\n💡 SOLUTION:`);
      console.log(`============`);
      console.log(`1. Créer un fichier .env avec:`);
      console.log(`   DATABASE_URL="file:./backend/prisma/dev.db"`);
      console.log(`2. Ou exécuter: npx prisma db push`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupAndDiagnose();
