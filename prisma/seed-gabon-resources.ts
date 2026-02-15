import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🏁 Démarrage du seeding des données (Version Finale)...')

    const creatorName = "Import Automatique"

    // --- 1. DÉPARTEMENTS DU GABON ---
    const departments = [
        { officiel: "Abanga-Bigné", populaire: "Ndjolé" },
        { officiel: "Akanda", populaire: "Akanda" },
        { officiel: "Basse-Banio", populaire: "Mayumba" },
        { officiel: "Bayi-Brikolo", populaire: "Aboumi" },
        { officiel: "Bendjé", populaire: "Port-Gentil" },
        { officiel: "Boumi-Louetsi", populaire: "Mbigou" },
        { officiel: "Djoué", populaire: "Onga" },
        { officiel: "Djouori-Agnili", populaire: "Bongoville" },
        { officiel: "Dola", populaire: "Ndendé" },
        { officiel: "Douigny", populaire: "Moabi" },
        { officiel: "Doutsila", populaire: "Mabanda" },
        { officiel: "Douya-Onoye", populaire: "Mouila" },
        { officiel: "Etimboué", populaire: "Omboué" },
        { officiel: "Haut-Komo", populaire: "Médouneu" },
        { officiel: "Haut-Ntem", populaire: "Minvoul" },
        { officiel: "Haute-Banio", populaire: "Ndindi" },
        { officiel: "Ivindo", populaire: "Makokou" },
        { officiel: "Komo", populaire: "Kango" },
        { officiel: "Komo-Océan", populaire: "Ndzomoe" },
        { officiel: "Komo-Mondah", populaire: "Ntoum" },
        { officiel: "Lemboumbi-Leyou", populaire: "Moanda" },
        { officiel: "Lékabi-Léwolo", populaire: "Ngouoni" },
        { officiel: "Lékoko", populaire: "Bakoumba" },
        { officiel: "Lékoni-Lékori", populaire: "Akiéni" },
        { officiel: "Lolo-Bouenguidi", populaire: "Koulamoutou" },
        { officiel: "Lombo-Bouenguidi", populaire: "Pana" },
        { officiel: "Lopé", populaire: "Booué" },
        { officiel: "Louetsi-Bibaka", populaire: "Malinga" },
        { officiel: "Louetsi-Wano", populaire: "Lébamba" },
        { officiel: "Mongo", populaire: "Moulengui-Binza" },
        { officiel: "Mougalaba", populaire: "Guiétsou" },
        { officiel: "Mougoutsi", populaire: "Tchibanga" },
        { officiel: "Mulundu", populaire: "Lastoursville" },
        { officiel: "Mpassa", populaire: "Franceville" },
        { officiel: "Mvoung", populaire: "Ovan" },
        { officiel: "Ndolou", populaire: "Mandji" },
        { officiel: "Ndougou", populaire: "Gamba" },
        { officiel: "Noya", populaire: "Cocobeach" },
        { officiel: "Ntem", populaire: "Bitam" },
        { officiel: "Offoué-Onoye", populaire: "Iboundji" },
        { officiel: "Ogooué et des Lacs", populaire: "Lambaréné" },
        { officiel: "Ogooué-Létili", populaire: "Boumango" },
        { officiel: "Ogoulou", populaire: "Mimongo" },
        { officiel: "Okano", populaire: "Mitzic" },
        { officiel: "Plateaux", populaire: "Lékoni" },
        { officiel: "Sébé-Brikolo", populaire: "Okondja" },
        { officiel: "Tsamba-Magotsi", populaire: "Fougamou" },
        { officiel: "Woleu", populaire: "Oyem" },
        { officiel: "Zadié", populaire: "Mékambo" }
    ]

    console.log('📍 Seeding des départements...')
    for (const dept of departments) {
        const displayName = `${dept.populaire} (${dept.officiel})`
        // Utilisation de (prisma as any) pour contourner les problemes de types persistants
        await (prisma as any).department.upsert({
            where: { name: displayName },
            update: { isActive: true },
            create: {
                name: displayName,
                isActive: true,
                description: `Département de ${dept.officiel}, chef-lieu ${dept.populaire}`
            }
        })
    }

    // --- 2. COLLECTIONS ---
    const collections = ["Collection LAHA", "Collection citoyenne", "Collection vitale"]
    console.log('📚 Seeding des collections (via table Discipline)...')
    for (const col of collections) {
        await prisma.discipline.upsert({
            where: { name: col },
            update: { isActive: true },
            create: {
                name: col,
                description: `Collection de livres: ${col}`,
                isActive: true
            }
        })
    }

    // --- 3. CLASSES ---
    const classes = [
        { name: "CI", section: "Primaire" },
        { name: "CP", section: "Primaire" },
        { name: "CE1", section: "Primaire" },
        { name: "CE2", section: "Primaire" },
        { name: "CM1", section: "Primaire" },
        { name: "CM2", section: "Primaire" },
        { name: "6ème", section: "Secondaire" },
        { name: "5ème", section: "Secondaire" },
        { name: "4ème", section: "Secondaire" },
        { name: "3ème", section: "Secondaire" },
        { name: "2nde", section: "Secondaire" },
        { name: "1ère", section: "Secondaire" },
        { name: "Tle", section: "Secondaire" }
    ]
    console.log('🏫 Seeding des classes...')
    for (const cls of classes) {
        await prisma.schoolClass.upsert({
            where: { name: cls.name },
            update: { section: cls.section, isActive: true },
            create: {
                name: cls.name,
                section: cls.section,
                isActive: true,
                createdBy: creatorName
            }
        })
    }

    // --- 4. CATÉGORIES ---
    const categories = [
        { nom: "ROMAN", status: true },
        { nom: "HISTOIRE", status: true },
        { nom: "Livre Exercices (secondaire)", status: true },
        { nom: "Cahier d'activités (primaire)", status: true },
        { nom: "Manuels (Primaire et Secondaire)", status: true },
        { nom: "Guide du professeur (Secondaire)", status: true },
        { nom: "Coffrets (Primaire)", status: true },
        { nom: "Guide de l'enseignant (Primaire)", status: true },
        { nom: "Annales (Primaire)", status: true },
        { nom: "Parascolaire", status: true }
    ]
    console.log('📁 Seeding des catégories...')
    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.nom },
            update: { isActive: cat.status },
            create: {
                name: cat.nom,
                isActive: cat.status,
                createdBy: creatorName
            }
        })
    }

    // --- 5. MATIÈRES (DISCIPLINES) ---
    const disciplines = [
        { name: "Français", section: "Langue" },
        { name: "Anglais", section: "Langue" },
        { name: "SVT", section: "Science" },
        { name: "Histoire - Géographie", section: "Science" },
        { name: "Mathématiques", section: "Science" },
        { name: "EPS", section: "Science" },
        { name: "Allemand", section: "Langue" },
        { name: "Philosophie", section: "Langue" },
        { name: "Économie", section: "Science" },
        { name: "PCT", section: "Science" },
        { name: "Espagnol", section: "Langue" },
        { name: "Éducation civique et morale", section: "Science" },
        { name: "Economie (Sociales)", section: "Science" },
        { name: "ES", section: "Science" },
        { name: "EST", section: "Science" }
    ]
    console.log('🧪 Seeding des disciplines...')
    for (const disc of disciplines) {
        await prisma.discipline.upsert({
            where: { name: disc.name },
            update: { isActive: true },
            create: {
                name: disc.name,
                description: `Discipline de type ${disc.section}`,
                isActive: true
                // createdBy n'existe pas pour Discipline
            }
        })
    }

    console.log('✅ Seeding final terminé avec succès !')
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
