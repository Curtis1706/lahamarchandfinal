// Script pour vérifier les disciplines disponibles
const checkDisciplines = async () => {
  try {
    console.log("Vérification des disciplines...");

    const response = await fetch('/api/disciplines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Disciplines trouvées:", result);
      if (result.length > 0) {
        console.log("Première discipline disponible:", result[0]);
      } else {
        console.log("⚠️ Aucune discipline trouvée");
      }
    } else {
      console.error("❌ Erreur lors de la récupération des disciplines:", result);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
  }
};

// Exécuter la vérification
checkDisciplines();


