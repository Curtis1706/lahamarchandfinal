// Script pour créer un auteur de test
const createTestAuteur = async () => {
  const testAuteur = {
    name: "Auteur Test",
    email: "auteur.test@example.com",
    phone: "+22912345678",
    role: "AUTEUR",
    status: "ACTIVE",
    password: "password123"
  };

  try {
    console.log("Création d'un auteur de test...");
    console.log("Données:", testAuteur);

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAuteur)
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Auteur créé avec succès:", result);
      console.log("ID de l'auteur:", result.id);
      console.log("Email:", result.email);
    } else {
      console.error("❌ Erreur lors de la création de l'auteur:", result);
    }
  } catch (error) {
    console.error("❌ Erreur réseau:", error);
  }
};

// Exécuter la création
createTestAuteur();




