// Script pour tester la création d'œuvres avec les corrections
const testWorkCreationFixed = async () => {
  console.log("🚀 Test de création d'œuvres avec les corrections");
  console.log("=" .repeat(50));

  try {
    // 1. Vérifier les disciplines disponibles
    console.log("\n1. Vérification des disciplines...");
    const disciplinesResponse = await fetch('/api/disciplines');
    const disciplines = await disciplinesResponse.json();
    
    if (!disciplinesResponse.ok || disciplines.length === 0) {
      console.log("❌ Aucune discipline trouvée");
      return;
    }
    
    console.log(`✅ ${disciplines.length} disciplines trouvées`);
    console.log("Première discipline:", disciplines[0]);

    // 2. Vérifier les utilisateurs disponibles
    console.log("\n2. Vérification des utilisateurs...");
    const usersResponse = await fetch('/api/users');
    const users = await usersResponse.json();
    
    if (!usersResponse.ok || users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé");
      return;
    }
    
    const auteurs = users.filter(user => user.role === 'AUTEUR');
    console.log(`✅ ${auteurs.length} auteur(s) trouvé(s)`);
    
    if (auteurs.length === 0) {
      console.log("❌ Aucun auteur trouvé");
      return;
    }

    // 3. Test de création d'œuvre avec les bons champs
    console.log("\n3. Test de création d'œuvre...");
    
    const testWork = {
      title: "Test de création d'œuvre - " + new Date().toISOString(),
      disciplineId: disciplines[0].id,
      authorId: auteurs[0].id,
      isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      price: 15000,
      stock: 100,
      minStock: 10,
      maxStock: 1000,
      status: "DRAFT"
    };

    console.log("Données de test:", testWork);

    const createWorkResponse = await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWork)
    });

    const workResult = await createWorkResponse.json();

    if (createWorkResponse.ok) {
      console.log("✅ Œuvre créée avec succès:", workResult);
      
      // 4. Vérifier que l'œuvre apparaît dans la liste
      console.log("\n4. Vérification de la liste des œuvres...");
      const worksResponse = await fetch('/api/works');
      const works = await worksResponse.json();
      
      if (worksResponse.ok) {
        console.log(`✅ ${works.works?.length || works.length || 0} œuvre(s) trouvée(s) dans la liste`);
        
        const createdWork = works.works?.find(w => w.id === workResult.id) || 
                           works.find(w => w.id === workResult.id);
        
        if (createdWork) {
          console.log("✅ L'œuvre créée apparaît dans la liste:", {
            id: createdWork.id,
            title: createdWork.title,
            status: createdWork.status,
            isbn: createdWork.isbn
          });
        }
      }
    } else {
      console.log("❌ Erreur lors de la création de l'œuvre:", workResult);
    }

    console.log("\n" + "=" .repeat(50));
    console.log("🏁 Test terminé");

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
};

// Exécuter le test
testWorkCreationFixed();


