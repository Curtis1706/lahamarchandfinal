const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixImagePaths() {
    console.log('🔍 Recherche des œuvres avec des chemins d\'images incorrects...\n');

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
            }
        });

        console.log(`📚 ${works.length} œuvres trouvées avec des fichiers\n`);

        let fixed = 0;
        let skipped = 0;

        for (const work of works) {
            if (!work.files) {
                skipped++;
                continue;
            }

            try {
                const filesData = typeof work.files === 'string'
                    ? JSON.parse(work.files)
                    : work.files;

                let needsUpdate = false;
                const updatedFilesData = { ...filesData };

                // Corriger le chemin de l'image de couverture si nécessaire
                if (filesData.coverImage && filesData.coverImage.includes('/upload/works/')) {
                    console.log(`🔧 Correction de l'image pour: "${work.title}"`);
                    console.log(`   Ancien: ${filesData.coverImage}`);

                    updatedFilesData.coverImage = filesData.coverImage.replace('/upload/works/', '/uploads/works/');

                    console.log(`   Nouveau: ${updatedFilesData.coverImage}\n`);
                    needsUpdate = true;
                }

                // Corriger les autres fichiers si présents
                if (Array.isArray(filesData.files)) {
                    updatedFilesData.files = filesData.files.map((file) => {
                        if (file.path && file.path.includes('/upload/works/')) {
                            return {
                                ...file,
                                path: file.path.replace('/upload/works/', '/uploads/works/')
                            };
                        }
                        return file;
                    });

                    if (JSON.stringify(filesData.files) !== JSON.stringify(updatedFilesData.files)) {
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await prisma.work.update({
                        where: { id: work.id },
                        data: {
                            files: JSON.stringify(updatedFilesData)
                        }
                    });
                    fixed++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de l'œuvre "${work.title}":`, error);
                skipped++;
            }
        }

        console.log('\n✅ Correction terminée!');
        console.log(`   - ${fixed} œuvre(s) corrigée(s)`);
        console.log(`   - ${skipped} œuvre(s) ignorée(s)`);
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixImagePaths();
