const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Utiliser la configuration par défaut du projet
const prisma = new PrismaClient();

async function createCleanRepresentatives() {
  try {
    console.log("👥 Création de représentants propres");
    console.log("====================================");

    // 1. Vérifier les représentants existants
    const existingRepresentatives = await prisma.user.findMany({
      where: { role: "REPRESENTANT" },
      select: { name: true, email: true }
    });

    console.log(`📊 ${existingRepresentatives.length} représentant(s) existant(s):`);
    existingRepresentatives.forEach(rep => {
      console.log(`   • ${rep.name} (${rep.email})`);
    });

    // 2. Créer de nouveaux représentants propres
    const newRepresentatives = [
      {
        name: "Pierre Représentant Nord",
        email: "pierre.nord@lahamarchand.com",
        phone: "+237 123 456 789"
      },
      {
        name: "Marie Représentante Sud", 
        email: "marie.sud@lahamarchand.com",
        phone: "+237 987 654 321"
      }
    ];

    console.log(`\n➕ Création de ${newRepresentatives.length} nouveau(x) représentant(s)...`);

    const defaultPassword = await bcrypt.hash("password123", 10);
    const createdRepresentatives = [];

    for (const repData of newRepresentatives) {
      try {
        // Vérifier si le représentant existe déjà
        const existing = await prisma.user.findUnique({
          where: { email: repData.email }
        });

        if (existing) {
          console.log(`   ⚠️ Représentant existant: ${repData.email}`);
          continue;
        }

        // Créer le représentant SANS données associées
        const newRepresentative = await prisma.user.create({
          data: {
            name: repData.name,
            email: repData.email,
            password: defaultPassword,
            role: "REPRESENTANT",
            status: "ACTIVE"
          }
        });

        createdRepresentatives.push(newRepresentative);
        console.log(`   ✅ Créé: ${newRepresentative.name} (${newRepresentative.email})`);

      } catch (error) {
        console.error(`   ❌ Erreur création ${repData.email}:`, error.message);
      }
    }

    // 3. Vérification que les nouveaux représentants n'ont pas de données
    console.log(`\n🔍 Vérification des nouveaux représentants:`);
    
    for (const rep of createdRepresentatives) {
      const ordersCount = await prisma.order.count({
        where: { userId: rep.id }
      });

      const notificationsCount = await prisma.notification.count({
        where: { userId: rep.id }
      });

      const partnersCount = await prisma.partner.count({
        where: { representantId: rep.id }
      });

      console.log(`   📊 ${rep.name}:`);
      console.log(`      📦 Commandes: ${ordersCount}`);
      console.log(`      🔔 Notifications: ${notificationsCount}`);
      console.log(`      🤝 Partenaires: ${partnersCount}`);

      if (ordersCount === 0 && notificationsCount === 0 && partnersCount === 0) {
        console.log(`      ✅ Représentant propre (aucune donnée par défaut)`);
      } else {
        console.log(`      ⚠️ ATTENTION: Données par défaut détectées!`);
      }
    }

    // 4. Résumé final
    console.log(`\n📋 RÉSUMÉ:`);
    console.log(`===========`);
    console.log(`✅ ${createdRepresentatives.length} représentant(s) créé(s) proprement`);
    console.log(`🔑 Mot de passe par défaut: password123`);
    console.log(`🌐 Connexion: http://localhost:3000/auth/login`);

    console.log(`\n📧 Comptes créés:`);
    createdRepresentatives.forEach(rep => {
      console.log(`   • ${rep.email} / password123`);
    });

    console.log(`\n💡 PROCHAINES ÉTAPES:`);
    console.log(`=====================`);
    console.log(`1. Connectez-vous avec un des nouveaux comptes`);
    console.log(`2. Vérifiez que le dashboard est vide`);
    console.log(`3. Testez la création de commandes manuellement`);

  } catch (error) {
    console.error("❌ Erreur lors de la création:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createCleanRepresentatives();
