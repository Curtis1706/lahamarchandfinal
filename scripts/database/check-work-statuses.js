// Script pour vérifier les statuts d'œuvres dans la base de données
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkStatuses() {
  try {
    console.log("🔍 Vérification des statuts d'œuvres dans la base de données");
    console.log("=" .repeat(50));

    // Vérifier les œuvres existantes et leurs statuts
    const works = await prisma.work.findMany({
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    console.log(`📖 Œuvres trouvées: ${works.length}`);
    
    // Grouper par statut
    const statusCounts = {};
    works.forEach(work => {
      statusCounts[work.status] = (statusCounts[work.status] || 0) + 1;
    });

    console.log("\n📊 Répartition par statut:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} œuvre(s)`);
    });

    // Afficher quelques exemples
    console.log("\n📝 Exemples d'œuvres:");
    works.slice(0, 5).forEach(work => {
      console.log(`- ${work.title} (${work.status})`);
    });

    // Tester la création d'une œuvre avec un statut DRAFT
    console.log("\n🧪 Test de création d'une œuvre avec statut DRAFT:");
    try {
      const discipline = await prisma.discipline.findFirst();
      const auteur = await prisma.user.findFirst({ where: { role: 'AUTEUR' } });
      
      if (discipline && auteur) {
        const testWork = await prisma.work.create({
          data: {
            title: `Test DRAFT - ${new Date().toISOString()}`,
            isbn: `978-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            price: 10000,
            stock: 50,
            minStock: 5,
            maxStock: 500,
            disciplineId: discipline.id,
            authorId: auteur.id,
            status: 'DRAFT'
          }
        });
        
        console.log("✅ Œuvre DRAFT créée avec succès:", {
          id: testWork.id,
          title: testWork.title,
          status: testWork.status
        });
        
        // Supprimer l'œuvre de test
        await prisma.work.delete({ where: { id: testWork.id } });
        console.log("🗑️ Œuvre de test supprimée");
      }
    } catch (error) {
      console.error("❌ Erreur lors du test de création DRAFT:", error.message);
    }

  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkStatuses();




