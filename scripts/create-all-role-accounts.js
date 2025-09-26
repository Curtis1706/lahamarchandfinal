const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAllRoleAccounts() {
  console.log("👥 Création de comptes pour tous les rôles");
  console.log("==========================================");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();

    // Mot de passe commun pour tous les comptes de test
    const commonPassword = "password123";
    const hashedPassword = await bcrypt.hash(commonPassword, 10);

    // Créer ou récupérer les disciplines de test
    console.log("\n📚 Création des disciplines...");
    const disciplines = [];
    
    const disciplineNames = [
      "Littérature",
      "Mathématiques", 
      "Histoire-Géographie",
      "Sciences Physiques",
      "Sciences de la Vie et de la Terre",
      "Anglais",
      "Français",
      "Philosophie"
    ];

    for (const name of disciplineNames) {
      try {
        const discipline = await prisma.discipline.create({
          data: { name }
        });
        disciplines.push(discipline);
        console.log(`✅ Discipline créée: ${discipline.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          // La discipline existe déjà
          const existingDiscipline = await prisma.discipline.findUnique({
            where: { name }
          });
          disciplines.push(existingDiscipline);
          console.log(`✅ Discipline existante: ${name}`);
        } else {
          console.error(`❌ Erreur discipline ${name}:`, error.message);
        }
      }
    }

    // Comptes à créer
    const accounts = [
      // PDG
      {
        name: "Jean-Pierre Directeur",
        email: "pdg@lahamarchand.com",
        role: "PDG",
        description: "Président Directeur Général"
      },
      {
        name: "Marie Administratrice", 
        email: "admin@lahamarchand.com",
        role: "PDG",
        description: "Administratrice générale"
      },

      // CONCEPTEURS
      {
        name: "Alphonse Concepteur",
        email: "alphonse.concepteur@lahamarchand.com", 
        role: "CONCEPTEUR",
        disciplineId: disciplines[0]?.id, // Littérature
        description: "Concepteur spécialisé en Littérature"
      },
      {
        name: "Sophie Mathématiques",
        email: "sophie.maths@lahamarchand.com",
        role: "CONCEPTEUR", 
        disciplineId: disciplines[1]?.id, // Mathématiques
        description: "Conceptrice spécialisée en Mathématiques"
      },
      {
        name: "Pierre Sciences",
        email: "pierre.sciences@lahamarchand.com",
        role: "CONCEPTEUR",
        disciplineId: disciplines[3]?.id, // Sciences Physiques
        description: "Concepteur spécialisé en Sciences"
      },

      // AUTEURS
      {
        name: "Émilie Auteure",
        email: "emilie.auteure@lahamarchand.com",
        role: "AUTEUR",
        disciplineId: disciplines[0]?.id, // Littérature
        description: "Auteure de romans et manuels littéraires"
      },
      {
        name: "Marc Historien",
        email: "marc.historien@lahamarchand.com", 
        role: "AUTEUR",
        disciplineId: disciplines[2]?.id, // Histoire-Géographie
        description: "Auteur spécialisé en Histoire"
      },
      {
        name: "Claire Philosophe",
        email: "claire.philosophe@lahamarchand.com",
        role: "AUTEUR",
        disciplineId: disciplines[7]?.id, // Philosophie
        description: "Auteure de manuels de philosophie"
      },

      // REPRESENTANTS
      {
        name: "Thomas Représentant",
        email: "thomas.rep@lahamarchand.com",
        role: "REPRESENTANT",
        description: "Représentant commercial région Nord"
      },
      {
        name: "Julie Commerciale",
        email: "julie.commerciale@lahamarchand.com",
        role: "REPRESENTANT", 
        description: "Représentante commerciale région Sud"
      },

      // CLIENTS
      {
        name: "École Primaire Saint-Martin",
        email: "ecole.saintmartin@education.fr",
        role: "CLIENT",
        description: "École primaire publique"
      },
      {
        name: "Lycée Victor Hugo",
        email: "lycee.victorhugo@education.fr", 
        role: "CLIENT",
        description: "Lycée général et technologique"
      },
      {
        name: "Collège Jean Moulin",
        email: "college.jeanmoulin@education.fr",
        role: "CLIENT",
        description: "Collège public"
      }
    ];

    console.log("\n👥 Création des comptes utilisateurs...");
    
    const createdAccounts = [];

    for (const account of accounts) {
      try {
        const user = await prisma.user.create({
          data: {
            name: account.name,
            email: account.email,
            password: hashedPassword,
            role: account.role,
            status: "ACTIVE",
            disciplineId: account.disciplineId || null
          }
        });
        
        createdAccounts.push({
          ...user,
          description: account.description,
          plainPassword: commonPassword
        });
        
        console.log(`✅ ${account.role}: ${account.name} (${account.email})`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Compte existant: ${account.email}`);
          // Récupérer le compte existant
          const existingUser = await prisma.user.findUnique({
            where: { email: account.email }
          });
          if (existingUser) {
            createdAccounts.push({
              ...existingUser,
              description: account.description,
              plainPassword: commonPassword
            });
          }
        } else {
          console.error(`❌ Erreur création ${account.email}:`, error.message);
        }
      }
    }

    console.log("\n📊 RÉCAPITULATIF DES COMPTES CRÉÉS:");
    console.log("====================================");

    // Grouper par rôle
    const roleGroups = {
      PDG: [],
      CONCEPTEUR: [],
      AUTEUR: [],
      REPRESENTANT: [],
      CLIENT: []
    };

    createdAccounts.forEach(account => {
      if (roleGroups[account.role]) {
        roleGroups[account.role].push(account);
      }
    });

    // Afficher par rôle
    Object.entries(roleGroups).forEach(([role, users]) => {
      if (users.length > 0) {
        console.log(`\n👑 ${role} (${users.length} compte${users.length > 1 ? 's' : ''}):`);
        users.forEach(user => {
          console.log(`   📧 ${user.email}`);
          console.log(`   👤 ${user.name}`);
          console.log(`   🔑 ${user.plainPassword}`);
          if (user.description) {
            console.log(`   📝 ${user.description}`);
          }
          console.log(`   🌐 Dashboard: /dashboard/${role.toLowerCase()}`);
          console.log("");
        });
      }
    });

    console.log("\n🔐 INFORMATIONS DE CONNEXION:");
    console.log("==============================");
    console.log("URL de connexion: http://localhost:3000/auth/login");
    console.log("Mot de passe universel: password123");

    console.log("\n🎯 TESTS RECOMMANDÉS:");
    console.log("======================");
    console.log("1. PDG - Gestion complète:");
    console.log("   📧 pdg@lahamarchand.com");
    console.log("   🎛️ /dashboard/pdg");

    console.log("\n2. Concepteur - Projets et œuvres:");
    console.log("   📧 alphonse.concepteur@lahamarchand.com");
    console.log("   🎨 /dashboard/concepteur");

    console.log("\n3. Auteur - Soumission d'œuvres:");
    console.log("   📧 emilie.auteure@lahamarchand.com");
    console.log("   ✍️ /dashboard/auteur");

    console.log("\n4. Représentant - Suivi commercial:");
    console.log("   📧 thomas.rep@lahamarchand.com");
    console.log("   💼 /dashboard/representant");

    console.log("\n5. Client - Consultation et commandes:");
    console.log("   📧 ecole.saintmartin@education.fr");
    console.log("   🛒 /dashboard/client");

    console.log("\n🚀 SYSTÈME MULTI-RÔLES OPÉRATIONNEL!");

  } catch (error) {
    console.error("❌ Erreur lors de la création des comptes:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Déconnexion de la base de données");
  }
}

createAllRoleAccounts().catch(console.error);
