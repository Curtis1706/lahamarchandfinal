const { PrismaClient } = require('@prisma/client');

async function diagnoseRepresentativesProduction() {
  try {
    console.log("🔍 Diagnostic des représentants (Production/Neon)");
    console.log("================================================");

    // Vérifier la variable d'environnement
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.log("❌ Variable DATABASE_URL non trouvée");
      console.log("\n💡 SOLUTIONS:");
      console.log("=============");
      console.log("1. Créer un fichier .env.local avec:");
      console.log('   DATABASE_URL="postgresql://username:password@host:port/database"');
      console.log("\n2. Ou utiliser la base Neon:");
      console.log("   - Aller sur https://neon.tech");
      console.log("   - Copier l'URL de connexion");
      console.log("   - L'ajouter dans .env.local");
      console.log("\n3. Ou définir temporairement:");
      console.log("   set DATABASE_URL=postgresql://... (Windows)");
      console.log("   export DATABASE_URL=postgresql://... (Linux/Mac)");
      return;
    }

    console.log(`✅ DATABASE_URL configurée: ${dbUrl.substring(0, 20)}...`);

    // Créer le client Prisma
    const prisma = new PrismaClient();

    console.log(`\n🔌 Connexion à la base de données...`);
    
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
        createdAt: true,
        status: true
      }
    });

    console.log(`\n📊 ${representatives.length} représentant(s) trouvé(s):`);
    representatives.forEach(rep => {
      console.log(`   • ${rep.name} (${rep.email})`);
      console.log(`     Statut: ${rep.status} - Créé le ${rep.createdAt.toLocaleDateString()}`);
    });

    if (representatives.length === 0) {
      console.log(`\n✅ Aucun représentant trouvé - problème résolu!`);
      console.log(`💡 Vous pouvez créer des représentants propres maintenant.`);
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
              work: {
                select: { title: true, isbn: true }
              }
            }
          }
        }
      });

      console.log(`   📦 Commandes créées: ${ordersCreated.length}`);
      if (ordersCreated.length > 0) {
        totalDataFound += ordersCreated.length;
        ordersCreated.forEach(order => {
          console.log(`      - Commande ${order.id} (${order.status})`);
          console.log(`        ${order.items.length} item(s) - ${order.createdAt.toLocaleDateString()}`);
          order.items.forEach(item => {
            console.log(`          • ${item.work.title} (x${item.quantity})`);
          });
        });
      }

      // Partenaires associés au représentant
      const partners = await prisma.partner.findMany({
        where: { representantId: rep.id },
        select: { name: true, type: true, createdAt: true }
      });

      console.log(`   🤝 Partenaires associés: ${partners.length}`);
      if (partners.length > 0) {
        totalDataFound += partners.length;
        partners.forEach(partner => {
          console.log(`      - ${partner.name} (${partner.type}) - ${partner.createdAt.toLocaleDateString()}`);
        });
      }

      // Notifications reçues
      const notifications = await prisma.notification.findMany({
        where: { userId: rep.id },
        select: { title: true, type: true, createdAt: true }
      });

      console.log(`   🔔 Notifications: ${notifications.length}`);
      if (notifications.length > 0) {
        totalDataFound += notifications.length;
        notifications.slice(0, 3).forEach(notif => {
          console.log(`      - ${notif.title} (${notif.type}) - ${notif.createdAt.toLocaleDateString()}`);
        });
        if (notifications.length > 3) {
          console.log(`      ... et ${notifications.length - 3} autres`);
        }
      }
    }

    // Vérifier la répartition des commandes par rôle
    console.log(`\n🔍 Vérification globale des commandes...`);
    
    const ordersByRole = await prisma.order.groupBy({
      by: ['userId'],
      _count: { id: true },
      _max: { createdAt: true }
    });

    const roleStats = {};
    for (const orderGroup of ordersByRole) {
      const user = await prisma.user.findUnique({
        where: { id: orderGroup.userId },
        select: { role: true, name: true }
      });
      
      if (user) {
        if (!roleStats[user.role]) roleStats[user.role] = 0;
        roleStats[user.role] += orderGroup._count.id;
      }
    }

    console.log(`   📊 Répartition des commandes par rôle:`);
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count} commandes`);
    });

    // Diagnostic final et recommandations
    console.log(`\n💡 DIAGNOSTIC FINAL:`);
    console.log(`====================`);
    
    if (totalDataFound > 0) {
      console.log(`❌ PROBLÈME CONFIRMÉ: ${totalDataFound} données associées aux représentants`);
      console.log(`\n🛠️ SOLUTIONS RECOMMANDÉES:`);
      console.log(`1. Nettoyage ciblé des représentants:`);
      console.log(`   node scripts/clean-representative-data-production.js`);
      console.log(`\n2. Si vous voulez tout nettoyer:`);
      console.log(`   npm run db:reset && npm run db:seed`);
      console.log(`\n3. Créer des représentants propres:`);
      console.log(`   node scripts/create-clean-representatives-production.js`);
    } else {
      console.log(`✅ AUCUN PROBLÈME: Les représentants n'ont pas de données par défaut`);
      console.log(`\n💡 Si vous voyez encore des données dans l'interface:`);
      console.log(`   - Vérifiez que vous regardez le bon compte représentant`);
      console.log(`   - Rafraîchissez la page (Ctrl+F5)`);
      console.log(`   - Vérifiez le cache du navigateur`);
      console.log(`   - Vérifiez que vous êtes connecté avec le bon compte`);
    }

    console.log(`\n🎯 PROCHAINES ÉTAPES:`);
    console.log(`=====================`);
    if (totalDataFound === 0) {
      console.log(`✅ Vous pouvez maintenant créer des représentants sans données par défaut`);
    } else {
      console.log(`🧹 Nettoyez d'abord les données existantes`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error.message);
    
    if (error.message.includes("Environment variable not found")) {
      console.log(`\n💡 SOLUTION IMMÉDIATE:`);
      console.log(`=====================`);
      console.log(`Créez un fichier .env.local à la racine du projet avec:`);
      console.log(`DATABASE_URL="votre_url_neon_postgresql"`);
      console.log(`NEXTAUTH_SECRET="votre_secret"`);
      console.log(`NEXTAUTH_URL="http://localhost:3000"`);
    } else if (error.message.includes("connection") || error.message.includes("timeout")) {
      console.log(`\n💡 PROBLÈME DE CONNEXION:`);
      console.log(`=========================`);
      console.log(`1. Vérifiez que votre base Neon est active`);
      console.log(`2. Vérifiez l'URL de connexion`);
      console.log(`3. Vérifiez votre connexion internet`);
    }
  } finally {
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

diagnoseRepresentativesProduction();
