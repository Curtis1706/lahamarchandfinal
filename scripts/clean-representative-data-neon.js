const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function cleanRepresentativeDataNeon() {
  let prisma;
  
  try {
    console.log("🧹 Nettoyage des données des représentants (Neon PostgreSQL)");
    console.log("===========================================================");

    // Vérifier la variable d'environnement
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.log("❌ Variable DATABASE_URL non trouvée");
      console.log("💡 Créez un fichier .env.local avec votre URL Neon");
      return;
    }

    console.log(`✅ Connexion à Neon PostgreSQL...`);

    // Créer le client Prisma
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log(`✅ Connexion réussie`);

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
    let totalCleaned = 0;
    
    for (const rep of representatives) {
      console.log(`\n🧹 Nettoyage pour ${rep.name} (${rep.email}):`);
      
      // Supprimer les notifications
      const deletedNotifications = await prisma.notification.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   🔔 ${deletedNotifications.count} notification(s) supprimée(s)`);
      totalCleaned += deletedNotifications.count;

      // Supprimer les commandes créées par le représentant
      const deletedOrders = await prisma.order.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   📦 ${deletedOrders.count} commande(s) supprimée(s)`);
      totalCleaned += deletedOrders.count;

      // Supprimer les partenaires associés au représentant
      const deletedPartners = await prisma.partner.deleteMany({
        where: { representantId: rep.id }
      });
      console.log(`   🤝 ${deletedPartners.count} partenaire(s) supprimé(s)`);
      totalCleaned += deletedPartners.count;

      // Supprimer les royalties (si le représentant en a)
      const deletedRoyalties = await prisma.royalty.deleteMany({
        where: { userId: rep.id }
      });
      console.log(`   💰 ${deletedRoyalties.count} royaltie(s) supprimée(s)`);
      totalCleaned += deletedRoyalties.count;

      // Supprimer les messages envoyés/reçus
      const deletedSentMessages = await prisma.message.deleteMany({
        where: { senderId: rep.id }
      });
      const deletedReceivedMessages = await prisma.message.deleteMany({
        where: { recipientId: rep.id }
      });
      console.log(`   💬 ${deletedSentMessages.count + deletedReceivedMessages.count} message(s) supprimé(s)`);
      totalCleaned += deletedSentMessages.count + deletedReceivedMessages.count;

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
      console.log(`   ${totalCleaned} données supprimées`);
      console.log(`   Les représentants n'ont plus de données par défaut`);
      console.log(`\n💡 Vous pouvez maintenant créer des représentants propres`);
    } else {
      console.log(`\n⚠️ ATTENTION: Il reste des données associées aux représentants`);
      console.log(`   Veuillez vérifier manuellement ou exécuter le script à nouveau`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error.message);
    
    if (error.message.includes("Environment variable not found")) {
      console.log(`\n💡 SOLUTION:`);
      console.log(`=============`);
      console.log(`Créez un fichier .env.local avec votre URL Neon:`);
      console.log(`DATABASE_URL="postgresql://username:password@host.neon.tech/database"`);
    } else if (error.message.includes("connection") || error.message.includes("timeout")) {
      console.log(`\n💡 PROBLÈME DE CONNEXION:`);
      console.log(`=========================`);
      console.log(`1. Vérifiez que votre base Neon est active`);
      console.log(`2. Vérifiez l'URL de connexion`);
      console.log(`3. Vérifiez votre connexion internet`);
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

cleanRepresentativeDataNeon();
