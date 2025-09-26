// Script pour tester l'endpoint API /api/works
const testApiEndpoint = async () => {
  try {
    console.log("🚀 Test de l'endpoint API /api/works");
    console.log("=" .repeat(50));

    const testWork = {
      title: `Test API - ${new Date().toISOString()}`,
      disciplineId: "cmfu9p18l0000ul7ozanujzaq", // Mathématiques
      authorId: "cmfu9p1np000jul7o1w45bn30", // Dr. Paul Nguema
      isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      price: 15000,
      stock: 100,
      minStock: 10,
      maxStock: 1000,
      status: "PUBLISHED"
    };

    console.log("📝 Données à envoyer:", testWork);

    const response = await fetch('http://localhost:3000/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWork)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log("✅ Réponse de l'API:", responseData);
      console.log("📊 Status HTTP:", response.status);
    } else {
      console.error("❌ Erreur API:");
      console.error("📊 Status HTTP:", response.status);
      console.error("📝 Réponse d'erreur:", responseData);
    }

  } catch (error) {
    console.error("❌ Erreur lors du test API:");
    console.error("🔧 Erreur:", error.message);
    console.error("💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)");
  }
};

testApiEndpoint();
