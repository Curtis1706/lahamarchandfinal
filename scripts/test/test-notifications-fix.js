const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNotificationsFix() {
  try {
    console.log("🧪 Test de la correction des notifications");
    console.log("==========================================");

    // 1. Trouver un utilisateur de test
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'CONCEPTEUR' },
          { role: 'AUTEUR' },
          { role: 'PDG' }
        ]
      },
    });

    if (!user) {
      console.error("❌ Aucun utilisateur trouvé. Veuillez créer un utilisateur d'abord.");
      return;
    }

    console.log("✅ Utilisateur trouvé:", user.name, `(${user.role})`);

    // 2. Créer quelques notifications de test
    const testNotifications = [
      {
        userId: user.id,
        title: "Test Notification 1",
        message: "Ceci est une notification de test pour vérifier le système.",
        type: "TEST_NOTIFICATION",
        data: JSON.stringify({ testId: 1, category: "test" }),
        read: false
      },
      {
        userId: user.id,
        title: "Test Notification 2",
        message: "Une autre notification de test avec des données.",
        type: "PROJECT_ACCEPTED",
        data: JSON.stringify({ projectId: "test-project-123", status: "accepted" }),
        read: true
      },
      {
        userId: user.id,
        title: "Test Notification 3",
        message: "Notification de test pour les œuvres.",
        type: "WORK_SUBMITTED",
        data: JSON.stringify({ workId: "test-work-456", title: "Test Work" }),
        read: false
      }
    ];

    console.log("\n📝 Création des notifications de test...");
    
    for (const notificationData of testNotifications) {
      const notification = await prisma.notification.create({
        data: notificationData
      });
      console.log(`✅ Notification créée: ${notification.title} (${notification.read ? 'lue' : 'non lue'})`);
    }

    // 3. Vérifier la structure de la réponse de l'API
    console.log("\n🔍 Test de la structure de réponse de l'API...");
    
    // Simuler l'appel API
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    });

    const apiResponse = {
      notifications,
      unreadCount,
      total: notifications.length
    };

    console.log("📊 Structure de la réponse API:");
    console.log("   - notifications:", Array.isArray(apiResponse.notifications) ? "✅ Tableau" : "❌ Pas un tableau");
    console.log("   - unreadCount:", typeof apiResponse.unreadCount === 'number' ? "✅ Nombre" : "❌ Pas un nombre");
    console.log("   - total:", apiResponse.total);
    console.log("   - Nombre de notifications:", apiResponse.notifications.length);
    console.log("   - Notifications non lues:", apiResponse.unreadCount);

    // 4. Test des filtres
    console.log("\n🔍 Test des filtres...");
    
    const unreadNotifications = apiResponse.notifications.filter(n => !n.read);
    const readNotifications = apiResponse.notifications.filter(n => n.read);
    
    console.log("   - Notifications non lues (filtre):", unreadNotifications.length);
    console.log("   - Notifications lues (filtre):", readNotifications.length);
    
    // 5. Test de la recherche
    console.log("\n🔍 Test de la recherche...");
    
    const searchTerm = "test";
    const searchResults = apiResponse.notifications.filter(n => 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`   - Résultats pour "${searchTerm}":`, searchResults.length);
    searchResults.forEach(notif => {
      console.log(`     * ${notif.title} (${notif.read ? 'lue' : 'non lue'})`);
    });

    console.log("\n✅ Tests de correction des notifications terminés avec succès!");
    console.log("\n💡 Vérifications à faire:");
    console.log("   1. Connectez-vous avec l'utilisateur de test");
    console.log("   2. Allez sur la page des notifications");
    console.log("   3. Vérifiez que les notifications s'affichent correctement");
    console.log("   4. Testez les filtres et la recherche");
    console.log("   5. Vérifiez que la cloche de notifications fonctionne");

  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationsFix();
