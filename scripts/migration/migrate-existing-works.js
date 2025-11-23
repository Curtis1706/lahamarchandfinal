const { PrismaClient } = require('@prisma/client');

async function migrateExistingWorks() {
  console.log("🔄 Migration des œuvres existantes");
  console.log("===================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // 1. Vérifier les œuvres existantes avec concepteurId mais sans authorId
    console.log("\n1. 📊 Vérification des œuvres existantes...");
    
    const worksWithConcepteur = await prisma.work.findMany({
      where: {
        concepteurId: { not: null },
        authorId: null
      },
      include: {
        concepteur: { select: { id: true, name: true, email: true, role: true } },
        discipline: { select: { name: true } }
      }
    });

    console.log(`   Trouvé ${worksWithConcepteur.length} œuvre(s) créée(s) par des concepteurs`);

    if (worksWithConcepteur.length > 0) {
      console.log("\n📋 Œuvres à migrer:");
      worksWithConcepteur.forEach((work, index) => {
        console.log(`   ${index + 1}. "${work.title}" par ${work.concepteur?.name || 'Inconnu'} (${work.discipline?.name || 'N/A'})`);
      });

      console.log("\n⚠️ PROBLÈME DÉTECTÉ:");
      console.log("   Ces œuvres ont été créées par des concepteurs,");
      console.log("   mais selon les nouveaux rôles, seuls les AUTEURS peuvent créer des œuvres.");

      console.log("\n🔧 OPTIONS DE MIGRATION:");
      console.log("=========================");

      console.log("\n   Option 1 - Créer des comptes auteurs:");
      console.log("      • Créer un compte AUTEUR pour chaque concepteur");
      console.log("      • Transférer les œuvres vers ces nouveaux comptes");
      console.log("      • Préserver les données existantes");

      console.log("\n   Option 2 - Convertir concepteurs en auteurs:");
      console.log("      • Changer le rôle des concepteurs en AUTEUR");
      console.log("      • Mettre à jour authorId = concepteurId");
      console.log("      • ⚠️ Perte du rôle concepteur");

      console.log("\n   Option 3 - Supprimer les œuvres existantes:");
      console.log("      • Supprimer toutes les œuvres de concepteurs");
      console.log("      • Redémarrer avec une base propre");
      console.log("      • ⚠️ Perte de données");

      console.log("\n💡 RECOMMANDATION:");
      console.log("   Utiliser l'Option 1 pour préserver les données");
      console.log("   et respecter la nouvelle logique des rôles.");
    }

    // 2. Vérifier les œuvres avec authorId existant
    const worksWithAuthor = await prisma.work.findMany({
      where: {
        authorId: { not: null }
      },
      include: {
        author: { select: { name: true, role: true } }
      }
    });

    console.log(`\n   Trouvé ${worksWithAuthor.length} œuvre(s) avec auteur défini`);

    // 3. Proposer une migration automatique
    if (worksWithConcepteur.length > 0) {
      console.log("\n🤖 MIGRATION AUTOMATIQUE PROPOSÉE:");
      console.log("====================================");

      for (const work of worksWithConcepteur) {
        if (work.concepteur) {
          console.log(`\n   📝 Œuvre: "${work.title}"`);
          console.log(`   👨‍🎨 Concepteur: ${work.concepteur.name} (${work.concepteur.email})`);
          
          // Vérifier si un auteur existe déjà avec le même email
          const existingAuthor = await prisma.user.findFirst({
            where: {
              email: work.concepteur.email,
              role: "AUTEUR"
            }
          });

          if (existingAuthor) {
            console.log(`   ✅ Auteur existant trouvé: ${existingAuthor.id}`);
          } else {
            console.log(`   📝 Créer nouvel auteur basé sur: ${work.concepteur.name}`);
            console.log(`      Email: ${work.concepteur.email.replace('@', '.auteur@')}`);
          }
        }
      }

      console.log("\n⚠️ CETTE MIGRATION N'EST PAS APPLIQUÉE AUTOMATIQUEMENT");
      console.log("   Exécutez le script approprié selon votre choix.");
    }

    // 4. Statistiques finales
    const totalWorks = await prisma.work.count();
    const worksWithoutAuthor = await prisma.work.count({
      where: { authorId: null }
    });

    console.log("\n📊 STATISTIQUES:");
    console.log("==================");
    console.log(`   Total œuvres: ${totalWorks}`);
    console.log(`   Sans auteur: ${worksWithoutAuthor}`);
    console.log(`   Avec auteur: ${totalWorks - worksWithoutAuthor}`);

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

migrateExistingWorks().catch(console.error);
