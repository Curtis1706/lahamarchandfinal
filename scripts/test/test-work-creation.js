// Script pour tester la création d'œuvres
const testWorkCreation = async () => {
  const testWork = {
    title: "Test de création d'œuvre",
    description: "Ceci est un test de création d'œuvre depuis l'interface auteur",
    disciplineId: "test-discipline-id", // Vous devrez utiliser un ID de discipline valide
    authorId: "test-author-id", // Vous devrez utiliser un ID d'auteur valide
    isbn: "978-1234567890",
    price: 15000,
    stock: 100,
    pages: 200,
    targetAudience: "Étudiants",
    language: "fr",
    keywords: "test, création, œuvre",
    status: "DRAFT"
  };

  try {
    console.log("Test de création d'œuvre...");
    console.log("Données:", testWork);

    const response = await fetch('/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWork)
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Œuvre créée avec succès:", result);
    } else {
      console.error("❌ Erreur lors de la création:", result);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
  }
};

// Exécuter le test
testWorkCreation();




