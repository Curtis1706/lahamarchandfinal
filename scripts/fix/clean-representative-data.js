const { PrismaClient } = require('@prisma/client');

// Utiliser la configuration par défaut du projet
const prisma = new PrismaClient();

async function cleanRepresentativeData() {
  try {
    console.log("🧹 Nettoyage des données des représentants");
    console.log("===========================================");

    // 1. Trouver tous les représentants
    const representatives = await prisma.user.findMany({
      where: { role: "REPRESENTANT" },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`📊 ${representatives.length} représentant(s) trouvé(s)`);

    if (representatives.length === 0) {
      console.log("✅ Aucun représentant trouvé, rien à nettoyer");
      return;
    }

    // 2. Pour chaque représentant, supprimer ses données associées
    for (const rep of representatives) {
      console.log(`\n🧹 Nettoyage pour ${rep.name} (${rep.email}):`);
      
      // Supprimer les notifications
      const deletedNotifications = await prisma.notification.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   🔔 ${deletedNotifications.count} notification(s) supprimée(s)`);

      // Supprimer les commandes créées par le représentant
      const deletedOrders = await prisma.order.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   📦 ${deletedOrders.count} commande(s) supprimée(s)`);

      // Supprimer les partenaires associés au représentant
      const deletedPartners = await prisma.partner.deleteMany({
        where: { representantId: rep.id }
      });
      console.log(`   🤝 ${deletedPartners.count} partenaire(s) supprimé(s)`);

      // Supprimer les royalties (si le représentant en a)
      const deletedRoyalties = await prisma.royalty.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   💰 ${deletedRoyalties.count} royaltie(s) supprimée(s)`);

      console.log(`   ✅ ${rep.name} nettoyé avec succès`);
    }

    // 3. Vérification finale
    console.log(`\n🔍 Vérification finale:`);
    
    const remainingOrders = await prisma.order.count({
      where: {
        user: { role: "REPRESENTANT" }
      }
    });

    const remainingNotifications = await prisma.notification.count({
      where: {
        user: { role: "REPRESENTANT" }
      }
    });

    const remainingPartners = await prisma.partner.count({
      where: {
        representant: { role: "REPRESENTANT" }
      }
    });

    console.log(`   📦 Commandes restantes: ${remainingOrders}`);
    console.log(`   🔔 Notifications restantes: ${remainingNotifications}`);
    console.log(`   🤝 Partenaires restants: ${remainingPartners}`);

    if (remainingOrders === 0 && remainingNotifications === 0 && remainingPartners === 0) {
      console.log(`\n✅ NETTOYAGE TERMINÉ AVEC SUCCÈS!`);
      console.log(`   Les représentants n'ont plus de données par défaut`);
    } else {
      console.log(`\n⚠️ ATTENTION: Il reste des données associées aux représentants`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanRepresentativeData();
