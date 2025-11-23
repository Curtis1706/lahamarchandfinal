console.log("🧪 Test - API d'inscription auteur");
console.log("===================================");

async function testSignupAPI() {
  const testData = {
    name: "Test Auteur API",
    email: "test.auteur.api@gmail.com",
    phone: "96005483",
    role: "AUTEUR",
    password: "password123",
    disciplineId: null
  };

  console.log("\n📝 Données de test:");
  console.log("   Nom:", testData.name);
  console.log("   Email:", testData.email);
  console.log("   Téléphone:", testData.phone);
  console.log("   Rôle:", testData.role);

  console.log("\n🔍 Test de l'API POST /api/users...");

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log("\n📊 Résultat:");
    console.log("   Status:", response.status);
    console.log("   Response:", result);

    if (response.ok) {
      console.log("\n✅ SUCCÈS ! L'inscription auteur fonctionne !");
      console.log("   Le formulaire d'inscription devrait maintenant accepter les auteurs.");
    } else {
      console.log("\n❌ ÉCHEC !");
      console.log("   Erreur:", result.error);
    }

  } catch (error) {
    console.error("\n❌ Erreur réseau:", error.message);
    console.log("\n💡 Assurez-vous que le serveur est démarré (npm run dev)");
  }
}

console.log("\n⚠️ PRÉREQUIS:");
console.log("   Le serveur doit être démarré (npm run dev)");
console.log("   L'API /api/users doit être accessible");

console.log("\n🎯 OBJECTIF:");
console.log("   Vérifier que l'API accepte maintenant les comptes AUTEUR");

testSignupAPI().catch(console.error);
