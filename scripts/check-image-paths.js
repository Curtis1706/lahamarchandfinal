const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImagePaths() {
    console.log('🔍 Vérification des chemins d\'images dans la base de données...\n');

    try {
        const works = await prisma.work.findMany({
            where: {
                files: {
                    not: null
                }
            },
            select: {
                id: true,
                title: true,
                files: true
            },
            take: 5
        });

        console.log(`📚 ${works.length} premières œuvres trouvées:\n`);

        for (const work of works) {
            console.log(`\n📖 Titre: "${work.title}"`);
            console.log(`   ID: ${work.id}`);

            if (work.files) {
                try {
                    const filesData = typeof work.files === 'string'
                        ? JSON.parse(work.files)
                        : work.files;

                    console.log(`   Fichiers JSON:`, JSON.stringify(filesData, null, 2));
                } catch (e) {
                    console.log(`   ⚠️ Erreur parsing:`, work.files);
                }
            } else {
                console.log(`   (Aucun fichier)`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkImagePaths();
