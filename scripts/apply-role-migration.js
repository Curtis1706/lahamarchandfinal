const { PrismaClient } = require('@prisma/client');

async function applyRoleMigration() {
  console.log("🔄 Application de la migration des rôles");
  console.log("=========================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    console.log("\n1. 📊 Récupération des œuvres à migrer...");
    
    const worksToMigrate = await prisma.work.findMany({
      where: {
        concepteurId: { not: null },
        authorId: null
      },
      include: {
        concepteur: { select: { id: true, name: true, email: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log(`   Trouvé ${worksToMigrate.length} œuvre(s) à migrer`);

    if (worksToMigrate.length === 0) {
      console.log("✅ Aucune migration nécessaire !");
      return;
    }

    console.log("\n2. 👥 Création des comptes auteurs...");
    
    const createdAuthors = new Map();

    for (const work of worksToMigrate) {
      if (work.concepteur && !createdAuthors.has(work.concepteur.id)) {
        const concepteur = work.concepteur;
        
        // Créer un email auteur unique
        const authorEmail = concepteur.email.includes('@') 
          ? concepteur.email.replace('@', '.auteur@')
          : `${concepteur.email}.auteur@lahamarchand.com`;

        console.log(`   📝 Création auteur pour: ${concepteur.name}`);
        
        try {
          const newAuthor = await prisma.user.create({
            data: {
              name: `${concepteur.name} (Auteur)`,
              email: authorEmail,
              password: await require('bcryptjs').hash('password123', 10), // Mot de passe par défaut
              role: "AUTEUR",
              status: "VALIDATED" // Directement validé
            }
          });

          createdAuthors.set(concepteur.id, newAuthor.id);
          console.log(`   ✅ Auteur créé: ${newAuthor.name} (${newAuthor.email})`);
          
        } catch (error) {
          console.error(`   ❌ Erreur création auteur pour ${concepteur.name}:`, error.message);
        }
      }
    }

    console.log(`\n   📊 ${createdAuthors.size} auteur(s) créé(s)`);

    console.log("\n3. 🔄 Migration des œuvres...");
    
    let migratedCount = 0;
    
    for (const work of worksToMigrate) {
      if (work.concepteur && createdAuthors.has(work.concepteur.id)) {
        const newAuthorId = createdAuthors.get(work.concepteur.id);
        
        try {
          await prisma.work.update({
            where: { id: work.id },
            data: {
              authorId: newAuthorId,
              concepteurId: null // Supprimer la référence concepteur
            }
          });
          
          console.log(`   ✅ Œuvre migrée: "${work.title}"`);
          migratedCount++;
          
        } catch (error) {
          console.error(`   ❌ Erreur migration œuvre "${work.title}":`, error.message);
        }
      }
    }

    console.log(`\n   📊 ${migratedCount} œuvre(s) migrée(s)`);

    console.log("\n4. 🧹 Nettoyage des données...");
    
    // Supprimer les œuvres qui n'ont pas pu être migrées
    const orphanWorks = await prisma.work.findMany({
      where: { authorId: null }
    });

    if (orphanWorks.length > 0) {
      console.log(`   ⚠️ ${orphanWorks.length} œuvre(s) orpheline(s) trouvée(s)`);
      
      for (const orphan of orphanWorks) {
        await prisma.work.delete({ where: { id: orphan.id } });
        console.log(`   🗑️ Œuvre supprimée: "${orphan.title}"`);
      }
    }

    console.log("\n5. ✅ Vérification finale...");
    
    const finalStats = {
      totalWorks: await prisma.work.count(),
      worksWithAuthor: await prisma.work.count({ where: { authorId: { not: null } } }),
      worksWithoutAuthor: await prisma.work.count({ where: { authorId: null } }),
      totalAuthors: await prisma.user.count({ where: { role: "AUTEUR" } })
    };

    console.log(`   📊 Œuvres totales: ${finalStats.totalWorks}`);
    console.log(`   📊 Avec auteur: ${finalStats.worksWithAuthor}`);
    console.log(`   📊 Sans auteur: ${finalStats.worksWithoutAuthor}`);
    console.log(`   📊 Auteurs totaux: ${finalStats.totalAuthors}`);

    if (finalStats.worksWithoutAuthor === 0) {
      console.log("\n🎉 MIGRATION RÉUSSIE !");
      console.log("   Toutes les œuvres ont maintenant un auteur.");
      console.log("   Vous pouvez maintenant appliquer la migration Prisma.");
      
      console.log("\n📋 COMPTES CRÉÉS:");
      console.log("==================");
      
      const newAuthors = await prisma.user.findMany({
        where: { 
          role: "AUTEUR",
          email: { contains: ".auteur@" }
        },
        select: { name: true, email: true }
      });
      
      newAuthors.forEach(author => {
        console.log(`   👤 ${author.name}: ${author.email} / password123`);
      });
      
    } else {
      console.log("\n⚠️ MIGRATION INCOMPLÈTE");
      console.log(`   ${finalStats.worksWithoutAuthor} œuvre(s) sans auteur restante(s)`);
    }

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

applyRoleMigration().catch(console.error);
