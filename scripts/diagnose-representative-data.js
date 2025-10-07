const { PrismaClient } = require('@prisma/client');

// Utiliser la configuration par défaut du projet
const prisma = new PrismaClient();

async function diagnoseRepresentativeData() {
  try {
    console.log("🔍 Diagnostic des données des représentants");
    console.log("=============================================");

    // 1. Trouver tous les représentants
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

    // 2. Vérifier les commandes associées à chaque représentant
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

    // 3. Vérifier s'il y a des commandes orphelines
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

    // 4. Recommandations
    console.log(`\n💡 RECOMMANDATIONS:`);
    console.log(`===================`);
    
    if (representatives.some(rep => ordersCreated.length > 0)) {
      console.log(`❌ Problème détecté: Des représentants ont des commandes associées`);
      console.log(`   → Solution: Exécuter le script de nettoyage`);
    } else {
      console.log(`✅ Aucun problème détecté: Les représentants n'ont pas de données par défaut`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseRepresentativeData();
