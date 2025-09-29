// Script pour créer des disciplines de test
const setupTestDisciplines = async () => {
  const testDisciplines = [
    "Français",
    "Mathématiques", 
    "Histoire",
    "Géographie",
    "Sciences",
    "Littérature",
    "Philosophie",
    "Économie",
    "Informatique",
    "Arts"
  ];

  try {
    console.log("Création des disciplines de test...");

    for (const disciplineName of testDisciplines) {
      try {
        const response = await fetch('/api/disciplines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: disciplineName })
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`✅ Discipline "${disciplineName}" créée:`, result);
        } else if (result.error && result.error.includes("existe déjà")) {
          console.log(`⚠️ Discipline "${disciplineName}" existe déjà`);
        } else {
          console.error(`❌ Erreur pour "${disciplineName}":`, result);
        }
      } catch (error) {
        console.error(`❌ Erreur réseau pour "${disciplineName}":`, error);
      }
    }

    // Vérifier les disciplines existantes
    console.log("\nVérification des disciplines existantes...");
    const response = await fetch('/api/disciplines');
    const disciplines = await response.json();
    
    if (response.ok) {
      console.log("✅ Disciplines disponibles:", disciplines.map(d => ({ id: d.id, name: d.name })));
    } else {
      console.error("❌ Erreur lors de la récupération des disciplines:", disciplines);
    }

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
};

// Exécuter la configuration
setupTestDisciplines();




