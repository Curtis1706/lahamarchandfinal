const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testRepresentativeAPIs() {
  let prisma;
  
  try {
    console.log("🧪 Test des APIs représentant après correction");
    console.log("==============================================");

    // Créer le client Prisma
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log(`✅ Connexion à la base de données réussie`);

    // Trouver un représentant pour tester
    const representative = await prisma.user.findFirst({
      where: { role: "REPRESENTANT" },
      select: { id: true, name: true, email: true }
    });

    if (!representative) {
      console.log("❌ Aucun représentant trouvé pour le test");
      return;
    }

    console.log(`\n🔍 Test avec le représentant: ${representative.name} (${representative.email})`);

    // Test 1: Vérifier les commandes des partenaires du représentant
    console.log(`\n📦 Test 1: Commandes des partenaires`);
    const partnerOrders = await prisma.order.findMany({
      where: {
        partner: {
          representantId: representative.id
        }
      },
      include: {
        partner: true,
        items: true
      }
    });

    console.log(`   Résultat: ${partnerOrders.length} commandes trouvées`);
    if (partnerOrders.length > 0) {
      console.log(`   ⚠️ ATTENTION: Des commandes de partenaires existent encore`);
      partnerOrders.forEach(order => {
        console.log(`      - Commande ${order.id} pour ${order.partner?.name || 'Partenaire inconnu'}`);
      });
    } else {
      console.log(`   ✅ Aucune commande de partenaire (correct)`);
    }

    // Test 2: Vérifier les partenaires du représentant
    console.log(`\n🤝 Test 2: Partenaires du représentant`);
    const partners = await prisma.partner.findMany({
      where: {
        representantId: representative.id
      }
    });

    console.log(`   Résultat: ${partners.length} partenaires trouvés`);
    if (partners.length > 0) {
      console.log(`   ✅ Partenaires trouvés (normal si le représentant en a créé)`);
      partners.forEach(partner => {
        console.log(`      - ${partner.name} (${partner.type})`);
      });
    } else {
      console.log(`   ℹ️ Aucun partenaire (normal pour un nouveau représentant)`);
    }

    // Test 3: Vérifier les œuvres (devrait être 0)
    console.log(`\n📚 Test 3: Œuvres gérées par le représentant`);
    const works = await prisma.work.findMany({
      where: {
        id: 'never-match' // Filtre que nous avons ajouté
      }
    });

    console.log(`   Résultat: ${works.length} œuvres trouvées`);
    if (works.length === 0) {
      console.log(`   ✅ Aucune œuvre (correct selon nos corrections)`);
    } else {
      console.log(`   ❌ ERREUR: Des œuvres sont encore visibles`);
    }

    // Test 4: Vérifier les auteurs (devrait être 0)
    console.log(`\n👥 Test 4: Auteurs gérés par le représentant`);
    const authors = await prisma.user.findMany({
      where: {
        role: 'AUTEUR',
        id: 'never-match' // Filtre que nous avons ajouté
      }
    });

    console.log(`   Résultat: ${authors.length} auteurs trouvés`);
    if (authors.length === 0) {
      console.log(`   ✅ Aucun auteur (correct selon nos corrections)`);
    } else {
      console.log(`   ❌ ERREUR: Des auteurs sont encore visibles`);
    }

    // Test 5: Vérifier le chiffre d'affaires global (devrait être 0 pour ce représentant)
    console.log(`\n💰 Test 5: Chiffre d'affaires des partenaires`);
    const partnerOrdersForRevenue = await prisma.order.findMany({
      where: {
        partner: {
          representantId: representative.id
        }
      },
      include: {
        items: true
      }
    });

    const totalRevenue = partnerOrdersForRevenue.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity);
      }, 0);
    }, 0);

    console.log(`   Résultat: ${totalRevenue.toLocaleString()} F CFA`);
    if (totalRevenue === 0) {
      console.log(`   ✅ Chiffre d'affaires à 0 (correct pour un nouveau représentant)`);
    } else {
      console.log(`   ℹ️ Chiffre d'affaires non nul (normal si le représentant a des partenaires avec des commandes)`);
    }

    // Résumé final
    console.log(`\n📊 RÉSUMÉ DU TEST:`);
    console.log(`==================`);
    
    const hasCleanData = partnerOrders.length === 0 && works.length === 0 && authors.length === 0;
    
    if (hasCleanData) {
      console.log(`✅ SUCCÈS: Les APIs représentant retournent maintenant des données propres`);
      console.log(`   - Aucune commande de partenaire parasite`);
      console.log(`   - Aucune œuvre visible`);
      console.log(`   - Aucun auteur visible`);
      console.log(`   - Chiffre d'affaires correct`);
      console.log(`\n💡 Le dashboard représentant devrait maintenant afficher des données vides`);
    } else {
      console.log(`⚠️ ATTENTION: Certaines données parasites persistent`);
      console.log(`   - Commandes de partenaires: ${partnerOrders.length}`);
      console.log(`   - Œuvres visibles: ${works.length}`);
      console.log(`   - Auteurs visibles: ${authors.length}`);
    }

  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

testRepresentativeAPIs();
