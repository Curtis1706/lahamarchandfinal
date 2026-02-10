const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary (utilise les variables d'env ou les valeurs en dur pour le script)
// Note: Les variables d'env devraient être chargées via dotenv si pas déjà présentes
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

console.log("Configuration Cloudinary :", process.env.CLOUDINARY_CLOUD_NAME);

async function migrate() {
    const works = await prisma.work.findMany({
        where: {
            files: {
                contains: '/uploads/'
            }
        }
    });

    console.log(`Trouvé ${works.length} œuvres à migrer.`);

    for (const work of works) {
        try {
            const filesData = JSON.parse(work.files);
            let updated = false;

            // Migrer coverImage
            if (filesData.coverImage && filesData.coverImage.startsWith('/uploads/')) {
                const localPath = path.join(process.cwd(), 'public', filesData.coverImage);

                if (fs.existsSync(localPath)) {
                    console.log(`Migration de l'image de couverture pour "${work.title}" (${localPath})...`);

                    const result = await cloudinary.uploader.upload(localPath, {
                        folder: 'laha/works',
                        public_id: path.basename(localPath).split('.')[0]
                    });

                    console.log(`✅ Uploadé : ${result.secure_url}`);
                    filesData.coverImage = result.secure_url;
                    updated = true;
                } else {
                    console.warn(`⚠️ Fichier local introuvable : ${localPath}`);
                }
            }

            // Migrer les autres fichiers si nécessaire
            if (filesData.files && Array.isArray(filesData.files)) {
                for (let fileObj of filesData.files) {
                    if (fileObj.path && fileObj.path.startsWith('/uploads/')) {
                        const localPath = path.join(process.cwd(), 'public', fileObj.path);
                        if (fs.existsSync(localPath)) {
                            console.log(`Migration du fichier "${fileObj.originalName}" pour "${work.title}"...`);
                            const result = await cloudinary.uploader.upload(localPath, {
                                folder: `laha/${work.projectId ? 'projects' : 'works'}`,
                                resource_type: 'auto'
                            });
                            fileObj.path = result.secure_url;
                            updated = true;
                        }
                    }
                }
            }

            if (updated) {
                await prisma.work.update({
                    where: { id: work.id },
                    data: {
                        files: JSON.stringify(filesData)
                    }
                });
                console.log(`✅ Base de données mise à jour pour "${work.title}"`);
            }

        } catch (e) {
            console.error(`❌ Erreur lors de la migration de "${work.title}":`, e.message);
        }
    }

    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
