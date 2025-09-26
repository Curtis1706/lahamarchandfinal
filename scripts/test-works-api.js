console.log("🧪 Test - API Works après correction");
console.log("===================================");

async function testWorksAPI() {
  console.log("\n🔍 Test de l'API /api/works");

  try {
    const response = await fetch('http://localhost:3000/api/works', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    console.log("\n📊 Résultat:");
    console.log("   Status:", response.status);
    console.log("   Type de réponse:", typeof result);
    console.log("   Nombre d'œuvres:", Array.isArray(result) ? result.length : "Erreur");

    if (response.ok) {
      console.log("\n✅ SUCCÈS ! L'API fonctionne correctement");
      
      if (Array.isArray(result) && result.length === 0) {
        console.log("\n📝 Aucune œuvre trouvée (normal après reset)");
        console.log("   Vous pouvez maintenant créer des œuvres via l'interface");
      } else if (Array.isArray(result)) {
        console.log(`\n📚 ${result.length} œuvre(s) trouvée(s):`);
        result.forEach((work, index) => {
          console.log(`   ${index + 1}. "${work.title}"`);
          console.log(`      • Auteur: ${work.author?.name || "Non défini"}`);
          console.log(`      • Discipline: ${work.discipline?.name || "Non définie"}`);
          console.log(`      • Statut: ${work.status}`);
        });
      }
    } else {
      console.log("\n❌ ÉCHEC !");
      console.log("   Erreur:", result.error || "Erreur inconnue");
      
      if (result.error && result.error.includes("concepteur")) {
        console.log("\n🔧 Erreur liée au champ 'concepteur' détectée");
        console.log("   Vérifiez que toutes les références ont été supprimées");
      }
    }

  } catch (error) {
    console.error("\n❌ Erreur réseau:", error.message);
    console.log("\n💡 Vérifications:");
    console.log("   1. Le serveur est-il démarré ? (npm run dev)");
    console.log("   2. L'API est-elle accessible ?");
    console.log("   3. Y a-t-il des erreurs dans la console ?");
  }
}

console.log("\n⚠️ PRÉREQUIS:");
console.log("   Le serveur doit être démarré (npm run dev)");
console.log("   L'API /api/works doit être accessible");

console.log("\n🎯 OBJECTIF:");
console.log("   Vérifier que l'API works fonctionne après correction du schéma");

testWorksAPI().catch(console.error);
