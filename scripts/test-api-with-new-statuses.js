// Script pour tester l'endpoint API avec les nouveaux statuts
const testApiWithNewStatuses = async () => {
  try {
    console.log("🚀 Test de l'endpoint API avec les nouveaux statuts");
    console.log("=" .repeat(50));

    // Test 1: Créer une œuvre en brouillon
    console.log("\n📝 Test 1: Création d'une œuvre en brouillon");
    const draftWork = {
      title: `Test API Brouillon - ${new Date().toISOString()}`,
      disciplineId: "cmfu9p18l0001ul7o4a8t1mia", // Histoire
      authorId: "cmfu9p1np000jul7o1w45bn30", // Dr. Paul Nguema
      isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      price: 15000,
      stock: 100,
      minStock: 10,
      maxStock: 1000,
      status: "DRAFT"
    };

    console.log("📝 Données à envoyer:", draftWork);

    const draftResponse = await fetch('http://localhost:3000/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftWork)
    });

    const draftResult = await draftResponse.json();

    if (draftResponse.ok) {
      console.log("✅ Brouillon créé:", {
        id: draftResult.id,
        title: draftResult.title,
        status: draftResult.status
      });
    } else {
      console.error("❌ Erreur création brouillon:", draftResult);
      return;
    }

    // Test 2: Créer une œuvre soumise pour validation
    console.log("\n📤 Test 2: Création d'une œuvre soumise pour validation");
    const pendingWork = {
      title: `Test API Soumission - ${new Date().toISOString()}`,
      disciplineId: "cmfu9p18l0001ul7o4a8t1mia", // Histoire
      authorId: "cmfu9p1np000jul7o1w45bn30", // Dr. Paul Nguema
      isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      price: 20000,
      stock: 150,
      minStock: 10,
      maxStock: 1000,
      status: "PENDING"
    };

    const pendingResponse = await fetch('http://localhost:3000/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingWork)
    });

    const pendingResult = await pendingResponse.json();

    if (pendingResponse.ok) {
      console.log("✅ Œuvre soumise:", {
        id: pendingResult.id,
        title: pendingResult.title,
        status: pendingResult.status
      });
    } else {
      console.error("❌ Erreur soumission:", pendingResult);
    }

    console.log("\n" + "=" .repeat(50));
    console.log("🏁 Test API terminé avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors du test API:", error);
  }
};

testApiWithNewStatuses();




