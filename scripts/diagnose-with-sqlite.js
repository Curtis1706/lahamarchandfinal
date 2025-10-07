const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function diagnoseWithSqlite() {
  try {
    console.log("🔧 Diagnostic avec SQLite");
    console.log("=========================");

    // Créer un client Prisma avec configuration SQLite
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./backend/prisma/dev.db"
        }
      }
    });

    console.log(`✅ Connexion à la base SQLite`);

    // Vérifier la connexion
    await prisma.$connect();
    console.log(`✅ Connexion réussie`);

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

    if (representatives.length === 0) {
      console.log(`\n✅ Aucun représentant trouvé - problème résolu!`);
      return;
    }

    // Pour chaque représentant, vérifier ses données
    let totalDataFound = 0;
    
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
        totalDataFound += ordersCreated.length;
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
        totalDataFound += partners.length;
        partners.forEach(partner => {
          console.log(`      - ${partner.name} (${partner.type})`);
        });
      }

      // Notifications reçues
      const notifications = await prisma.notification.findMany({
        where: { userId: rep.id }
      });

      console.log(`   🔔 Notifications: ${notifications.length}`);
      if (notifications.length > 0) {
        totalDataFound += notifications.length;
      }
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
    console.log(`\n💡 DIAGNOSTIC FINAL:`);
    console.log(`====================`);
    
    if (totalDataFound > 0) {
      console.log(`❌ PROBLÈME CONFIRMÉ: ${totalDataFound} données associées aux représentants`);
      console.log(`\n🛠️ SOLUTIONS RECOMMANDÉES:`);
      console.log(`1. Nettoyage ciblé:`);
      console.log(`   node scripts/clean-representative-data.js`);
      console.log(`\n2. Reset complet (si vous voulez tout nettoyer):`);
      console.log(`   npm run db:reset && npm run db:seed`);
    } else {
      console.log(`✅ AUCUN PROBLÈME: Les représentants n'ont pas de données par défaut`);
      console.log(`\n💡 Si vous voyez encore des données dans l'interface:`);
      console.log(`   - Vérifiez que vous regardez le bon compte`);
      console.log(`   - Rafraîchissez la page`);
      console.log(`   - Vérifiez le cache du navigateur`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error.message);
    
    if (error.message.includes("Error validating datasource")) {
      console.log(`\n💡 SOLUTION ALTERNATIVE:`);
      console.log(`========================`);
      console.log(`Le schéma Prisma est configuré pour PostgreSQL mais vous avez SQLite.`);
      console.log(`\nOptions:`);
      console.log(`1. Utiliser PostgreSQL (recommandé):`);
      console.log(`   - Configurer une base PostgreSQL`);
      console.log(`   - Mettre à jour DATABASE_URL`);
      console.log(`\n2. Changer temporairement pour SQLite:`);
      console.log(`   - Modifier prisma/schema.prisma`);
      console.log(`   - Changer provider de "postgresql" à "sqlite"`);
      console.log(`   - Exécuter: npx prisma generate`);
    }
  } finally {
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

diagnoseWithSqlite();
