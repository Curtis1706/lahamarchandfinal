// Script complet pour tester le workflow de création d'œuvres
const testCompleteWorkflow = async () => {
  console.log("🚀 Test complet du workflow de création d'œuvres");
  console.log("=" .repeat(50));

  try {
    // 1. Vérifier les disciplines disponibles
    console.log("\n1. Vérification des disciplines...");
    const disciplinesResponse = await fetch('/api/disciplines');
    const disciplines = await disciplinesResponse.json();
    
    if (disciplinesResponse.ok && disciplines.length > 0) {
      console.log(`✅ ${disciplines.length} disciplines trouvées`);
      console.log("Première discipline:", disciplines[0]);
    } else {
      console.log("⚠️ Aucune discipline trouvée, création d'une discipline de test...");
      
      // Créer une discipline de test
      const createDisciplineResponse = await fetch('/api/disciplines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Discipline' })
      });
      
      if (createDisciplineResponse.ok) {
        console.log("✅ Discipline de test créée");
      } else {
        console.log("❌ Impossible de créer une discipline de test");
        return;
      }
    }

    // 2. Vérifier les utilisateurs disponibles
    console.log("\n2. Vérification des utilisateurs...");
    const usersResponse = await fetch('/api/users');
    const users = await usersResponse.json();
    
    if (usersResponse.ok && users.length > 0) {
      console.log(`✅ ${users.length} utilisateurs trouvés`);
      const auteurs = users.filter(user => user.role === 'AUTEUR');
      console.log(`📝 ${auteurs.length} auteur(s) trouvé(s)`);
      
      if (auteurs.length > 0) {
        console.log("Premier auteur:", auteurs[0]);
      }
    } else {
      console.log("❌ Aucun utilisateur trouvé");
      return;
    }

    // 3. Test de création d'œuvre
    console.log("\n3. Test de création d'œuvre...");
    
    const testWork = {
      title: "Test de création d'œuvre - " + new Date().toISOString(),
      description: "Ceci est un test de création d'œuvre depuis l'interface auteur",
      disciplineId: disciplines[0]?.id || "test-discipline-id",
      authorId: users.find(u => u.role === 'AUTEUR')?.id || "test-author-id",
      isbn: "978-" + Math.random().toString().substr(2, 10),
      price: 15000,
      stock: 100,
      pages: 200,
      targetAudience: "Étudiants",
      language: "fr",
      keywords: "test, création, œuvre",
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
            status: createdWork.status
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
testCompleteWorkflow();



