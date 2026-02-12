
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { title: 'nhn' },
        include: { concepteur: true }
    });

    if (!project) {
        console.log('Project "nhn" not found');
    } else {
        console.log('Project found:');
        console.log('ID:', project.id);
        console.log('Title:', project.title);
        console.log('Objectives:', project.objectives);
        console.log('Deliverables:', project.expectedDeliverables);
        console.log('Resources:', project.requiredResources);
        console.log('Timeline:', project.timeline);
        console.log('Files (raw):', project.files);
        console.log('Created At:', project.createdAt);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
