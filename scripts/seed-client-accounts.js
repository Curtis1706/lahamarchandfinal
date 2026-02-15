const { PrismaClient, Role, ClientType } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Création des comptes clients...");

    // Mot de passe commun pour tous les comptes
    const hashedPassword = await bcrypt.hash("laha", 12);

    // 1. Créer un client de chaque type
    console.log("\n📋 Création des clients par type...");

    const clientParticulier = await prisma.client.upsert({
        where: { id: "client-particulier-1" },
        update: {},
        create: {
            id: "client-particulier-1",
            nom: "Jean Dupont",
            telephone: "+241 01 23 45 67",
            email: "jean.dupont@example.com",
            address: "123 Rue de la Liberté",
            city: "Libreville",
            type: ClientType.particulier,
            statut: "ACTIF",
        },
    });

    const clientBoutique = await prisma.client.upsert({
        where: { id: "client-boutique-1" },
        update: {},
        create: {
            id: "client-boutique-1",
            nom: "Librairie du Centre",
            telephone: "+241 02 34 56 78",
            email: "contact@librairie-centre.ga",
            address: "Avenue du Commerce",
            city: "Port-Gentil",
            type: ClientType.boutique,
            statut: "ACTIF",
        },
    });

    const clientGrossiste = await prisma.client.upsert({
        where: { id: "client-grossiste-1" },
        update: {},
        create: {
            id: "client-grossiste-1",
            nom: "Distribution Livres Gabon",
            telephone: "+241 03 45 67 89",
            email: "info@dlg.ga",
            address: "Zone Industrielle Owendo",
            city: "Libreville",
            type: ClientType.grossiste,
            statut: "ACTIF",
        },
    });

    const clientEcoleContractuelle = await prisma.client.upsert({
        where: { id: "client-ecole-contractuelle-1" },
        update: {},
        create: {
            id: "client-ecole-contractuelle-1",
            nom: "École Sainte-Marie",
            telephone: "+241 04 56 78 90",
            email: "direction@sainte-marie.ga",
            address: "Quartier Nombakélé",
            city: "Libreville",
            type: ClientType.ecole_contractuelle,
            statut: "ACTIF",
        },
    });

    const clientEcoleNonContractuelle = await prisma.client.upsert({
        where: { id: "client-ecole-non-contractuelle-1" },
        update: {},
        create: {
            id: "client-ecole-non-contractuelle-1",
            nom: "Institut Privé Excellence",
            telephone: "+241 05 67 89 01",
            email: "admin@excellence.ga",
            address: "Boulevard Triomphal",
            city: "Libreville",
            type: ClientType.ecole_non_contractuelle,
            statut: "ACTIF",
        },
    });

    const clientPartenaire = await prisma.client.upsert({
        where: { id: "client-partenaire-1" },
        update: {},
        create: {
            id: "client-partenaire-1",
            nom: "Éditions Multipress Gabon",
            telephone: "+241 06 78 90 12",
            email: "partenariat@multipress.ga",
            address: "Immeuble Le Phare",
            city: "Libreville",
            type: ClientType.partenaire,
            statut: "ACTIF",
        },
    });

    const clientBibliotheque = await prisma.client.upsert({
        where: { id: "client-bibliotheque-1" },
        update: {},
        create: {
            id: "client-bibliotheque-1",
            nom: "Bibliothèque Nationale du Gabon",
            telephone: "+241 07 89 01 23",
            email: "contact@bn-gabon.ga",
            address: "Centre-ville",
            city: "Libreville",
            type: ClientType.bibliotheque,
            statut: "ACTIF",
        },
    });

    console.log("✅ Clients créés:");
    console.log(`  - Particulier: ${clientParticulier.nom}`);
    console.log(`  - Boutique: ${clientBoutique.nom}`);
    console.log(`  - Grossiste: ${clientGrossiste.nom}`);
    console.log(`  - École contractuelle: ${clientEcoleContractuelle.nom}`);
    console.log(`  - École non contractuelle: ${clientEcoleNonContractuelle.nom}`);
    console.log(`  - Partenaire: ${clientPartenaire.nom}`);
    console.log(`  - Bibliothèque: ${clientBibliotheque.nom}`);

    // 2. Créer deux auteurs
    console.log("\n✍️ Création des auteurs...");

    const auteur1 = await prisma.user.upsert({
        where: { email: "auteur1@laha.ga" },
        update: {},
        create: {
            name: "Dr. Marie Koumba",
            email: "auteur1@laha.ga",
            password: hashedPassword,
            role: Role.AUTEUR,
            emailVerified: new Date(),
        },
    });

    const auteur2 = await prisma.user.upsert({
        where: { email: "auteur2@laha.ga" },
        update: {},
        create: {
            name: "Prof. Antoine Mboumba",
            email: "auteur2@laha.ga",
            password: hashedPassword,
            role: Role.AUTEUR,
            emailVerified: new Date(),
        },
    });

    console.log("✅ Auteurs créés:");
    console.log(`  - ${auteur1.name} (${auteur1.email})`);
    console.log(`  - ${auteur2.name} (${auteur2.email})`);

    // 3. Créer deux concepteurs
    console.log("\n🎨 Création des concepteurs...");

    // Récupérer une discipline pour les concepteurs
    const disciplines = await prisma.discipline.findMany({ take: 2 });

    if (disciplines.length < 2) {
        console.log("⚠️ Pas assez de disciplines. Création de disciplines...");
        const mathDiscipline = await prisma.discipline.upsert({
            where: { name: "Mathématiques" },
            update: {},
            create: { name: "Mathématiques", description: "Sciences mathématiques" },
        });
        const scienceDiscipline = await prisma.discipline.upsert({
            where: { name: "Sciences" },
            update: {},
            create: { name: "Sciences", description: "Sciences naturelles" },
        });
        disciplines.push(mathDiscipline, scienceDiscipline);
    }

    const concepteur1 = await prisma.user.upsert({
        where: { email: "concepteur1@laha.ga" },
        update: {},
        create: {
            name: "Dr. Sophie Ndong",
            email: "concepteur1@laha.ga",
            password: hashedPassword,
            role: Role.CONCEPTEUR,
            disciplineId: disciplines[0].id,
            emailVerified: new Date(),
        },
    });

    const concepteur2 = await prisma.user.upsert({
        where: { email: "concepteur2@laha.ga" },
        update: {},
        create: {
            name: "Prof. Pierre Ondo",
            email: "concepteur2@laha.ga",
            password: hashedPassword,
            role: Role.CONCEPTEUR,
            disciplineId: disciplines[1]?.id || disciplines[0].id,
            emailVerified: new Date(),
        },
    });

    console.log("✅ Concepteurs créés:");
    console.log(`  - ${concepteur1.name} (${concepteur1.email})`);
    console.log(`  - ${concepteur2.name} (${concepteur2.email})`);

    // 4. Créer deux partenaires
    console.log("\n🤝 Création des partenaires...");

    const partenaireUser1 = await prisma.user.upsert({
        where: { email: "partenaire1@laha.ga" },
        update: {},
        create: {
            name: "Librairie Moderne",
            email: "partenaire1@laha.ga",
            password: hashedPassword,
            role: Role.PARTENAIRE,
            emailVerified: new Date(),
        },
    });

    let partenaire1 = await prisma.partner.findFirst({
        where: { userId: partenaireUser1.id },
    });

    if (!partenaire1) {
        partenaire1 = await prisma.partner.create({
            data: {
                userId: partenaireUser1.id,
                name: "Librairie Moderne",
                type: "Distributeur",
                email: "partenaire1@laha.ga",
                phone: "+241 08 90 12 34",
                address: "Centre Commercial Mbolo, Libreville",
            },
        });
    }

    const partenaireUser2 = await prisma.user.upsert({
        where: { email: "partenaire2@laha.ga" },
        update: {},
        create: {
            name: "Éditions Raponda Walker",
            email: "partenaire2@laha.ga",
            password: hashedPassword,
            role: Role.PARTENAIRE,
            emailVerified: new Date(),
        },
    });

    let partenaire2 = await prisma.partner.findFirst({
        where: { userId: partenaireUser2.id },
    });

    if (!partenaire2) {
        partenaire2 = await prisma.partner.create({
            data: {
                userId: partenaireUser2.id,
                name: "Éditions Raponda Walker",
                type: "Éditeur",
                email: "partenaire2@laha.ga",
                phone: "+241 09 01 23 45",
                address: "Quartier Louis, Libreville",
            },
        });
    }

    console.log("✅ Partenaires créés:");
    console.log(`  - ${partenaire1.name} (${partenaireUser1.email})`);
    console.log(`  - ${partenaire2.name} (${partenaireUser2.email})`);

    // 5. Créer deux représentants
    console.log("\n👔 Création des représentants...");

    const representant1 = await prisma.user.upsert({
        where: { email: "representant1@laha.ga" },
        update: {},
        create: {
            name: "Mme. Claudine Oyono",
            email: "representant1@laha.ga",
            password: hashedPassword,
            role: Role.REPRESENTANT,
            emailVerified: new Date(),
        },
    });

    const representant2 = await prisma.user.upsert({
        where: { email: "representant2@laha.ga" },
        update: {},
        create: {
            name: "M. Hervé Mintsa",
            email: "representant2@laha.ga",
            password: hashedPassword,
            role: Role.REPRESENTANT,
            emailVerified: new Date(),
        },
    });

    console.log("✅ Représentants créés:");
    console.log(`  - ${representant1.name} (${representant1.email})`);
    console.log(`  - ${representant2.name} (${representant2.email})`);

    console.log("\n🎉 Tous les comptes ont été créés avec succès!");
    console.log("\n📝 Récapitulatif:");
    console.log("   Mot de passe pour tous les comptes: laha");
    console.log("\n   Types de clients créés:");
    console.log("   - 1 Particulier");
    console.log("   - 1 Boutique");
    console.log("   - 1 Grossiste");
    console.log("   - 1 École contractuelle");
    console.log("   - 1 École non contractuelle");
    console.log("   - 1 Partenaire");
    console.log("   - 1 Bibliothèque");
    console.log("\n   Utilisateurs créés:");
    console.log("   - 2 Auteurs");
    console.log("   - 2 Concepteurs");
    console.log("   - 2 Partenaires");
    console.log("   - 2 Représentants");
}

main()
    .catch((e) => {
        console.error("❌ Erreur:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
