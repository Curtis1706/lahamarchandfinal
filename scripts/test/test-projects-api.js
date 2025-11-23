console.log("🧪 Test - API Projets Validés");
console.log("=============================");

async function testProjectsAPI() {
  console.log("\n🔍 Test de l'API /api/projects?status=ACCEPTED");

  try {
    const response = await fetch('http://localhost:3000/api/projects?status=ACCEPTED', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    console.log("\n📊 Résultat:");
    console.log("   Status:", response.status);
    console.log("   Nombre de projets:", Array.isArray(result) ? result.length : "Erreur");

    if (response.ok && Array.isArray(result)) {
      console.log("\n✅ SUCCÈS ! L'API fonctionne correctement");
      
      if (result.length === 0) {
        console.log("\n⚠️ Aucun projet validé retourné par l'API");
        console.log("   Vérifiez que des projets sont en statut ACCEPTED");
      } else {
        console.log(`\n🎯 ${result.length} projet(s) validé(s) trouvé(s):`);
        result.forEach((project, index) => {
          console.log(`   ${index + 1}. "${project.title}"`);
          console.log(`      • ID: ${project.id}`);
          console.log(`      • Concepteur: ${project.concepteur?.name || "Non défini"}`);
          console.log(`      • Discipline: ${project.discipline?.name || "Non définie"}`);
          console.log(`      • Statut: ${project.status}`);
        });
      }
    } else {
      console.log("\n❌ ÉCHEC !");
      console.log("   Erreur:", result.error || "Erreur inconnue");
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
console.log("   L'API /api/projects doit être accessible");

console.log("\n🎯 OBJECTIF:");
console.log("   Vérifier que l'API retourne les projets validés");

testProjectsAPI().catch(console.error);